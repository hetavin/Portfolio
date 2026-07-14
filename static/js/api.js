document.addEventListener('DOMContentLoaded', () => {
    const botReplies = [
        'Hi there! How can I help you today?',
        'I am available for internships and project collaborations.',
        'Feel free to ask me about my Python, Flask, or OpenCV experience.',
        'You can reach me via email or phone for any opportunity.',
        'Thanks for dropping by — I look forward to working with you!'
    ];

    const chatMessages = document.getElementById('chatMessages');
    const chatToggle = document.getElementById('chatToggle');
    const chatPanel = document.getElementById('chatPanel');
    const chatClose = document.getElementById('chatClose');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');

    if (!chatMessages || !chatToggle || !chatPanel || !chatClose || !chatForm || !chatInput) {
        return;
    }

    function addMessage(text, sender) {
        const message = document.createElement('div');
        message.className = `chat-message ${sender}`;

        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble';
        bubble.textContent = text;

        message.appendChild(bubble);
        chatMessages.appendChild(message);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function setPanelOpen(isOpen) {
        chatPanel.classList.toggle('open', isOpen);
        chatPanel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
        chatToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

        if (isOpen) {
            chatInput.focus();
        }
    }

    chatToggle.addEventListener('click', () => {
        setPanelOpen(!chatPanel.classList.contains('open'));
    });

    chatClose.addEventListener('click', () => {
        setPanelOpen(false);
    });

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const message = chatInput.value.trim();
        if (!message) {
            return;
        }

        addMessage(message, 'user');
        chatInput.value = '';
        chatInput.focus();

        fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        })
            .then((response) => response.json())
            .then((data) => {
                const reply = data.reply || botReplies[Math.floor(Math.random() * botReplies.length)];
                addMessage(reply, 'bot');
            })
            .catch(() => {
                const reply = botReplies[Math.floor(Math.random() * botReplies.length)];
                addMessage(reply, 'bot');
            });
    });

    window.setTimeout(() => {
        addMessage('👋 Hi! I am Hetavin. Ask me about internships, projects or availability.', 'bot');
    }, 500);
});