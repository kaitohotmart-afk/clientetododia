const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Inicializa Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("ERRO: SUPABASE_URL ou SUPABASE_KEY não configurado no .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// FUNÇÃO DE ENVIO AUTOMÁTICO DE ACESSO
// ==========================================
async function sendCourseAccess(lead, isUpsell = false) {
    console.log(`\n========================================`);
    console.log(`[AUTOMÁTICO] LIBERAÇÃO DE CURSO`);
    console.log(`Enviando acesso para: ${lead.name || 'Cliente'} (${lead.email || 'Sem email'})`);
    console.log(`Método: Pagamento Confirmado (${lead.totalPaid} MZN)`);
    if (isUpsell) {
        console.log(`Produto Adicional: Bónus / Upsell liberado!`);
    }
    console.log(`========================================\n`);
    // Futura integração com SendGrid / Resend / Plataforma E-learning
    return true;
}

// ==========================================
// INTEGRAÇÃO UTMIFY
// ==========================================
async function sendToUtmify(lead, eventType = 'Purchase') {
    const token = process.env.UTMIFY_TOKEN;
    if (!token) return;
    
    try {
        console.log(`[UTMIFY] A disparar evento ${eventType} para ${lead.phone || lead.name}...`);
        
        const payload = {
            eventName: eventType,
            email: lead.email || '',
            phone: lead.phone || '',
            firstName: lead.name ? lead.name.split(' ')[0] : '',
            value: lead.totalPaid || lead.total || 0,
            currency: 'MZN'
        };

        // Postback padrão UTMIFY
        const response = await fetch('https://api.utmify.com.br/api/postback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Token': token
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log(`[UTMIFY] ✅ Evento disparado com sucesso!`);
        } else {
            console.log(`[UTMIFY] ❌ Falha no disparo: ${response.status}`);
        }
    } catch (e) {
        console.error('[UTMIFY] Erro na requisição:', e.message);
    }
}

// ==========================================
// RASTREAMENTO DE PÁGINA (FUNIL)
// ==========================================
app.post('/api/track-page', async (req, res) => {
    const { phone, page } = req.body;
    if (!phone || !page) return res.status(400).json({ ok: false });

    try {
        const { data: lead } = await supabase
            .from('leads')
            .select('id, last_page, pages_visited')
            .eq('phone', phone)
            .order('timestamp', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (lead) {
            const visited = lead.pages_visited
                ? (Array.isArray(lead.pages_visited) ? lead.pages_visited : JSON.parse(lead.pages_visited))
                : [];
            if (!visited.includes(page)) visited.push(page);

            await supabase.from('leads').update({
                last_page: page,
                pages_visited: JSON.stringify(visited)
            }).eq('id', lead.id);
        }
        res.json({ ok: true });
    } catch (e) {
        res.json({ ok: false });
    }
});

// ==========================================
// ETAPA 1: CAPTURA (LEAD)
// ==========================================
app.post('/api/save-lead', async (req, res) => {
    const { name, phone, source, timestamp } = req.body;
    
    try {
        const { data, error } = await supabase.from('leads').insert([{
            ref: `LEAD-${Date.now()}`,
            name,
            phone,
            status: 'lead',
            source: source || 'captura',
            timestamp: timestamp || new Date().toISOString(),
            last_page: 'captura.html',
            pages_visited: JSON.stringify(['captura.html'])
        }]);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        console.error('Erro save-lead:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================
// ETAPA 2: CHECKOUT (INICIAR PAGAMENTO)
// ==========================================
app.post('/api/initiate-payment', async (req, res) => {
    const { phone, name, email, orderBump, total } = req.body;

    if (!phone || !/^(84|85|86|87)\d{7}$/.test(phone)) {
        return res.status(400).json({ success: false, message: 'Número inválido' });
    }

    const ref = `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const finalTotal = total || 297;
    
    try {
        // Procura se já existe como lead
        const { data: existingLead } = await supabase
            .from('leads')
            .select('*')
            .eq('phone', phone)
            .eq('status', 'lead')
            .maybeSingle();

        if (existingLead) {
            await supabase.from('leads').update({
                ref,
                name,
                email,
                status: 'pending',
                orderBump: !!orderBump,
                total: finalTotal,
                timestamp: new Date().toISOString()
            }).eq('id', existingLead.id);
        } else {
            await supabase.from('leads').insert([{
                ref, phone, name, email,
                status: 'pending',
                source: 'checkout_direto',
                orderBump: !!orderBump,
                total: finalTotal,
                timestamp: new Date().toISOString()
            }]);
        }

        // MOCK M-PESA / E-MOLA
        setTimeout(async () => {
            const { data: tx } = await supabase.from('leads').select('*').eq('ref', ref).maybeSingle();
            if (tx && tx.status === 'pending') {
                await supabase.from('leads').update({
                    status: 'confirmed',
                    totalPaid: tx.total,
                    access_sent: true
                }).eq('id', tx.id);
                // Envio automático e Tracking
                await sendCourseAccess({ ...tx, totalPaid: tx.total });
                await sendToUtmify({ ...tx, totalPaid: tx.total }, 'Purchase');
            }
        }, 15000);

        res.json({ success: true, ref });
    } catch (err) {
        console.error('Erro initiate-payment:', err);
        res.status(500).json({ success: false });
    }
});

// Verificar pagamento
app.get('/api/check-payment', async (req, res) => {
    const { ref } = req.query;
    try {
        const { data: tx, error } = await supabase.from('leads').select('*').eq('ref', ref).maybeSingle();
        if (!tx) return res.status(404).json({ error: 'Not found' });
        
        if (tx.status === 'confirmed') res.json({ paid: true });
        else res.json({ paid: false });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Webhook M-Pesa Callback
app.post('/api/mpesa-callback', async (req, res) => {
    const { ref } = req.body;
    if (ref) {
        const { data: tx } = await supabase.from('leads').select('*').eq('ref', ref).maybeSingle();
        if (tx && tx.status !== 'confirmed') {
            await supabase.from('leads').update({
                status: 'confirmed',
                totalPaid: tx.total,
                access_sent: true
            }).eq('id', tx.id);
            // Envio automático e Tracking
            await sendCourseAccess({ ...tx, totalPaid: tx.total });
            await sendToUtmify({ ...tx, totalPaid: tx.total }, 'Purchase');
        }
    }
    res.status(200).send('OK');
});

// ==========================================
// ETAPA 3 & 4: UPSELL / DOWNSELL
// ==========================================
app.post('/api/upsell-accept', async (req, res) => {
    const { ref } = req.body;
    try {
        const { data: tx } = await supabase.from('leads').select('*').eq('ref', ref).maybeSingle();
        if (tx) {
            await supabase.from('leads').update({
                upsell: true,
                totalPaid: (tx.totalPaid || tx.total || 0) + 499
            }).eq('id', tx.id);
            await sendCourseAccess(tx, true);
            await sendToUtmify(tx, 'Upsell_Purchase');
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

app.post('/api/downsell-accept', async (req, res) => {
    const { ref } = req.body;
    try {
        const { data: tx } = await supabase.from('leads').select('*').eq('ref', ref).maybeSingle();
        if (tx) {
            await supabase.from('leads').update({
                downsell: true,
                totalPaid: (tx.totalPaid || tx.total || 0) + 99
            }).eq('id', tx.id);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// ==========================================
// ETAPA 6: EXPORTAÇÃO DE LEADS
// ==========================================
app.get('/api/leads', async (req, res) => {
    const { status } = req.query; // 'todos', 'lead_frio', 'checkout_abandonado', 'comprou'
    
    try {
        const { data: db, error } = await supabase.from('leads').select('*').order('timestamp', { ascending: false });
        if (error) throw error;
        
        let filtered = db.map(item => {
            let segment = 'desconhecido';
            if (item.status === 'lead') segment = 'lead_frio';
            else if (item.status === 'pending') segment = 'checkout_abandonado';
            else if (item.status === 'confirmed') segment = 'comprou';
            
            return { ...item, segment };
        });

        if (status && status !== 'todos') {
            filtered = filtered.filter(l => l.segment === status);
        }

        res.json(filtered);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fallback estático
app.get('*', (req, res) => {
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

// ==========================================
// ADMIN: REENVIAR ACESSO
// ==========================================
app.post('/api/admin/resend-access', async (req, res) => {
    const { id } = req.body;
    try {
        const { data: tx } = await supabase.from('leads').select('*').eq('id', id).maybeSingle();
        if (tx) {
            await sendCourseAccess(tx, tx.upsell);
            await supabase.from('leads').update({ access_sent: true }).eq('id', tx.id);
            return res.json({ success: true });
        }
        res.status(404).json({ success: false, message: 'Lead não encontrado' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================
// ESTRUTURA BASE: e2Payments
// ==========================================
app.post('/api/e2payments/initiate', async (req, res) => {
    // PENDENTE: Receber as credenciais (Client ID, Secret, Wallet)
    // Aqui geraremos o request oficial para a API do e2Payments
    res.json({ success: true, message: 'Integração e2Payments pendente de credenciais' });
});

app.post('/api/e2payments/webhook', async (req, res) => {
    // PENDENTE: Receber o callback oficial do e2Payments
    const { reference, status, amount } = req.body;
    console.log(`\n[e2Payments] 🔔 Webhook recebido - Ref: ${reference} | Status: ${status}`);
    
    // A lógica futura será atualizar o lead no Supabase, 
    // enviar o curso (sendCourseAccess) e notificar a Utmify (sendToUtmify).
    res.status(200).send('OK');
});

app.listen(PORT, () => console.log(`API a correr em http://localhost:${PORT}`));
