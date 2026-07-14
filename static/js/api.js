jQuery(document).ready(function () {

  // Open / close chat panel
  jQuery('#chatToggle').on('click', function () {
    const panel = jQuery('.chat-panel');
    const isOpen = panel.toggleClass('open').hasClass('open');
    jQuery('#chatToggle').attr('aria-expanded', isOpen);
    jQuery('#chatPanel').attr('aria-hidden', !isOpen);
    if (isOpen) {
      jQuery('#chatInput').focus();
      if (jQuery('#chatMessages').children().length === 0) appendWelcome();
    }
  });

  jQuery('#chatClose').on('click', function () {
    jQuery('.chat-panel').removeClass('open');
    jQuery('#chatToggle').attr('aria-expanded', 'false');
    jQuery('#chatPanel').attr('aria-hidden', 'true');
  });

  // ── Helpers ────────────────────────────────────────────────
  function scrollToBottom() {
    const msgs = document.getElementById('chatMessages');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }

  // Convert basic markdown → HTML for bot messages
  function formatMarkdown(text) {
    // Escape HTML first
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Bold **text** or __text__
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

    // Inline code `code`
    html = html.replace(/`([^`]+)`/g, '<code class="chat-code">$1</code>');

    // Split into lines for list detection
    const lines = html.split('\n');
    const out = [];
    let inUl = false, inOl = false;

    lines.forEach(line => {
      const ulMatch = line.match(/^[\s]*[-*•]\s+(.+)/);
      const olMatch = line.match(/^[\s]*(\d+)\.\s+(.+)/);

      if (ulMatch) {
        if (!inUl) { out.push('<ul class="chat-list">'); inUl = true; }
        if (inOl)  { out.push('</ol>'); inOl = false; }
        out.push(`<li>${ulMatch[1]}</li>`);
      } else if (olMatch) {
        if (!inOl) { out.push('<ol class="chat-list">'); inOl = true; }
        if (inUl)  { out.push('</ul>'); inUl = false; }
        out.push(`<li>${olMatch[2]}</li>`);
      } else {
        if (inUl) { out.push('</ul>'); inUl = false; }
        if (inOl) { out.push('</ol>'); inOl = false; }
        if (line.trim() === '') {
          out.push('<div class="chat-spacer"></div>');
        } else {
          out.push(`<p>${line}</p>`);
        }
      }
    });

    if (inUl) out.push('</ul>');
    if (inOl) out.push('</ol>');

    return out.join('');
  }

  function appendMessage(role, text) {
    const div = jQuery('<div>').addClass('chat-message ' + role);
    const bubble = jQuery('<div>').addClass('chat-bubble');

    if (role === 'bot') {
      bubble.addClass('chat-bubble--formatted').html(formatMarkdown(text));
    } else {
      bubble.text(text);
    }

    div.append(bubble);
    jQuery('#chatMessages').append(div);
    scrollToBottom();
  }

  function appendTyping() {
    const div = jQuery('<div>').addClass('chat-message bot').attr('id', 'typingIndicator');
    const bubble = jQuery('<div>').addClass('chat-bubble chat-typing');
    bubble.html('<span></span><span></span><span></span>');
    div.append(bubble);
    jQuery('#chatMessages').append(div);
    scrollToBottom();
    return div;
  }

  function appendWelcome() {
    appendMessage('bot',
      '👋 **Hi there!** I\'m Hetavin\'s AI assistant.\n\nAsk me anything about:\n- 🎓 Education & background\n- 💻 Skills & tech stack\n- 🚀 Projects he\'s built\n- 📬 Internship availability'
    );
  }

  // ── Submit ─────────────────────────────────────────────────
  jQuery('#chatForm').on('submit', function (e) {
    e.preventDefault();

    const input = jQuery('#chatInput');
    const message = input.val().trim();
    if (!message) return;

    input.val('');
    appendMessage('user', message);

    const sendBtn = jQuery('#chatForm button[type="submit"]');
    sendBtn.prop('disabled', true);
    const typing = appendTyping();

    jQuery.ajax({
      url: '/api/chat',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ message }),
      success: function (response) {
        typing.remove();
        appendMessage('bot', response.response || 'No response received.');
      },
      error: function () {
        typing.remove();
        appendMessage('bot', '⚠️ Sorry, something went wrong. Please try again.');
      },
      complete: function () {
        sendBtn.prop('disabled', false);
        input.focus();
      }
    });
  });

});
