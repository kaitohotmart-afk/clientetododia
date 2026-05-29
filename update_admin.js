const fs = require('fs');

let html = fs.readFileSync('public/admin/leads.html', 'utf8');

// Replace Stats Grid
const oldStatsGrid = `<div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total de Leads</div>
        <div class="stat-value blue" id="stat-total">—</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Leads Frios</div>
        <div class="stat-value amber" id="stat-leads">—</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Checkout Abandonado</div>
        <div class="stat-value red" id="stat-abandoned">—</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Compraram</div>
        <div class="stat-value green" id="stat-bought">—</div>
      </div>
    </div>`;

const newStatsGrid = `<div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total de Leads</div>
        <div class="stat-value blue" id="stat-total">—</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Checkouts Abandonados</div>
        <div class="stat-value red" id="stat-abandoned">—</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Vendas Realizadas</div>
        <div class="stat-value green" id="stat-bought">—</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Receita Total</div>
        <div class="stat-value amber" id="stat-revenue">—</div>
      </div>
    </div>`;

html = html.replace(oldStatsGrid, newStatsGrid);

// Replace thead
const oldThead = `<tr>
            <th>Data</th>
            <th>Nome</th>
            <th>E-mail</th>
            <th>WhatsApp</th>
            <th>Segmento</th>
            <th>Order Bump</th>
            <th>Upsell</th>
            <th>Downsell</th>
            <th>Total Pago</th>
          </tr>`;

const newThead = `<tr>
            <th>Data</th>
            <th>Nome / E-mail</th>
            <th>WhatsApp</th>
            <th>Segmento</th>
            <th>TxID / Método</th>
            <th>Total Pago</th>
            <th>Ação</th>
          </tr>`;

html = html.replace(oldThead, newThead);

// Replace updateStats
const oldUpdateStats = `function updateStats() {
    document.getElementById('stat-total').textContent    = allLeads.length;
    document.getElementById('stat-leads').textContent    = allLeads.filter(l => (l.segment||l.status) === 'lead_frio').length;
    document.getElementById('stat-abandoned').textContent = allLeads.filter(l => (l.segment||l.status) === 'checkout_abandonado').length;
    document.getElementById('stat-bought').textContent   = allLeads.filter(l => (l.segment||l.status) === 'comprou').length;

    renderFunnel();
  }`;

const newUpdateStats = `function updateStats() {
    const abandoned = allLeads.filter(l => (l.segment||l.status) === 'checkout_abandonado' || (l.segment||l.status) === 'failed').length;
    const bought = allLeads.filter(l => (l.segment||l.status) === 'comprou').length;
    const revenue = allLeads.filter(l => (l.segment||l.status) === 'comprou').reduce((sum, l) => sum + (parseFloat(l.totalPaid) || parseFloat(l.total) || 0), 0);

    document.getElementById('stat-total').textContent = allLeads.length;
    document.getElementById('stat-abandoned').textContent = abandoned;
    document.getElementById('stat-bought').textContent = bought;
    document.getElementById('stat-revenue').textContent = revenue + ' MZN';

    renderFunnel();
  }`;

html = html.replace(oldUpdateStats, newUpdateStats);

// Add getWaUrl and modify renderTable
const oldRenderTable = `function renderTable() {
    const tbody = document.getElementById('tbody');
    tbody.innerHTML = '';
    document.getElementById('result-count').textContent = \`\${allLeads.length} resultado\${allLeads.length !== 1 ? 's' : ''}\`;

    if (!allLeads.length) {
      tbody.innerHTML = \`<tr><td colspan="9" class="empty-state">
        <div class="icon">🔍</div>
        <div>Nenhum lead encontrado para este filtro.</div>
      </td></tr>\`;
      return;
    }

    allLeads.forEach(l => {
      const seg = l.segment || l.status;
      const tr  = document.createElement('tr');
      tr.innerHTML = \`
        <td style="white-space:nowrap;">\${new Date(l.timestamp).toLocaleString('pt-MZ', {dateStyle:'short', timeStyle:'short'})}</td>
        <td style="font-weight:500;">\${l.name || '—'}</td>
        <td style="color:var(--text-muted); font-size:13px;">\${l.email || '—'}</td>
        <td>\${getWaLink(l.phone, seg, l.name)}</td>
        <td>\${getBadge(seg)}</td>
        <td>\${dot(l.orderBump)}</td>
        <td>\${dot(l.upsell)}</td>
        <td>\${dot(l.downsell)}</td>
        <td style="font-weight:600;">\${l.totalPaid || l.total || 0} MZN</td>
      \`;
      tbody.appendChild(tr);
    });
  }`;

const newRenderTable = `function getWaUrl(phone, status, name) {
    if (!phone) return '#';
    let wpPhone = phone;
    if (wpPhone.length === 9) wpPhone = '258' + wpPhone;

    const firstName = name ? name.split(' ')[0] : 'lá';
    let msg = '';
    if (status === 'lead_frio') {
      msg = \`Olá \${firstName}! 👋 Vi que mostraste interesse no Método Clientes Todo Dia. Posso ajudar-te com alguma dúvida antes de avançares?\`;
    } else if (status === 'checkout_abandonado' || status === 'failed') {
      msg = \`Olá \${firstName}! Reparei que tentaste inscrever-te no Clientes Todo Dia mas o pagamento falhou ou foi cancelado. Tiveste algum problema com o M-Pesa/e-Mola? Estou aqui para ajudar! 😊\`;
    } else if (status === 'comprou') {
      msg = \`Olá \${firstName}! 🎉 Parabéns pela tua inscrição no Clientes Todo Dia! Já conseguiste aceder à plataforma?\`;
    } else {
      msg = \`Olá \${firstName}! Tudo bem?\`;
    }
    return \`https://wa.me/\${wpPhone}?text=\${encodeURIComponent(msg)}\`;
  }

  function renderTable() {
    const tbody = document.getElementById('tbody');
    tbody.innerHTML = '';
    document.getElementById('result-count').textContent = \`\${allLeads.length} resultado\${allLeads.length !== 1 ? 's' : ''}\`;

    if (!allLeads.length) {
      tbody.innerHTML = \`<tr><td colspan="7" class="empty-state">
        <div class="icon">🔍</div>
        <div>Nenhum lead encontrado para este filtro.</div>
      </td></tr>\`;
      return;
    }

    allLeads.forEach(l => {
      const seg = l.segment || l.status;
      const tr  = document.createElement('tr');
      
      let actionBtn = '—';
      if (seg === 'checkout_abandonado' || seg === 'failed') {
        actionBtn = \`<a href="\${getWaUrl(l.phone, seg, l.name)}" target="_blank" style="background:#10B981; color:#fff; padding:6px 12px; border-radius:6px; text-decoration:none; font-size:12px; font-weight:600; display:inline-flex; align-items:center; gap:4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> Recuperar</a>\`;
      }

      const txId = l.transaction_id ? l.transaction_id.substring(0,8) + '...' : '—';
      const pMethod = l.payment_method ? \`<br><small style="color:var(--text-muted); text-transform:uppercase;">\${l.payment_method}</small>\` : '';

      tr.innerHTML = \`
        <td style="white-space:nowrap;">\${new Date(l.timestamp).toLocaleString('pt-MZ', {dateStyle:'short', timeStyle:'short'})}</td>
        <td><div style="font-weight:500;">\${l.name || '—'}</div><div style="color:var(--text-muted); font-size:12px;">\${l.email || ''}</div></td>
        <td>\${getWaLink(l.phone, seg, l.name)}</td>
        <td>\${getBadge(seg)}</td>
        <td style="font-family:monospace; line-height:1.4;">\${txId}\${pMethod}</td>
        <td style="font-weight:600;">\${l.totalPaid || l.total || 0} MZN</td>
        <td>\${actionBtn}</td>
      \`;
      tbody.appendChild(tr);
    });
  }`;

html = html.replace(oldRenderTable, newRenderTable);

// also fix getBadge mapping for failed
html = html.replace("'checkout_abandonado':   ['badge-pending',   '● Abandonado'],", "'checkout_abandonado':   ['badge-pending',   '● Abandonado'],\n      'failed':                ['badge-pending',   '● Falhou'],");

fs.writeFileSync('public/admin/leads.html', html);
console.log('Update leads.html complete');
