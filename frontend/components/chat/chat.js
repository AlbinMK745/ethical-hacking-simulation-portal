class AIMentorChat {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.context = this.detectContext();
        this.baseUrl = 'http://127.0.0.1:8000/user/chat';

        this.initUI();
        this.attachEvents();
    }

    detectContext() {
        // Simple context detection based on URL or page content
        const pageTitle = document.getElementById('page-title')?.innerText || "Dashboard";
        const user = JSON.parse(localStorage.getItem('user')) || {};

        return {
            page: pageTitle,
            level: user.level || 1,
            user_id: user.id
        };
    }

    initUI() {
        // Create Chat Container
        const container = document.createElement('div');
        container.innerHTML = `
            <!-- Floating Button -->
            <div class="ai-chat-btn" id="aiChatBtn">
                <i class="fas fa-robot"></i>
            </div>

            <!-- Chat Panel -->
            <div class="ai-chat-panel" id="aiChatPanel">
                <!-- Header -->
                <div class="ai-chat-header">
                    <div class="ai-header-info">
                        <div class="ai-avatar"><i class="fas fa-robot"></i></div>
                        <div class="ai-title">
                            <h4>Cyber Mentor</h4>
                            <span><i class="fas fa-circle" style="color: #22c55e; font-size: 8px;"></i> Online</span>
                        </div>
                    </div>
                    <div class="ai-close" id="aiCloseBtn"><i class="fas fa-times"></i></div>
                </div>

                <!-- Messages -->
                <div class="ai-chat-messages" id="aiChatMessages">
                    <div class="msg ai">
                        Greetings. I am your specialized cybersecurity mentor. <br>
                        I can help you with hints, concepts, or mission guidance.<br>
                        <strong>How can I assist you today?</strong>
                    </div>
                </div>

                <!-- Input -->
                <div class="ai-chat-input-area">
                    <input type="text" id="aiChatInput" placeholder="Ask for a hint or explain a concept..." autocomplete="off">
                    <button class="ai-send-btn" id="aiSendBtn">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(container);

        this.panel = document.getElementById('aiChatPanel');
        this.btn = document.getElementById('aiChatBtn');
        this.messagesContainer = document.getElementById('aiChatMessages');
        this.input = document.getElementById('aiChatInput');
        this.sendBtn = document.getElementById('aiSendBtn');
        this.closeBtn = document.getElementById('aiCloseBtn');
    }

    attachEvents() {
        this.btn.addEventListener('click', () => this.toggle());
        this.closeBtn.addEventListener('click', () => this.toggle());

        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    toggle() {
        this.isOpen = !this.isOpen;
        this.panel.classList.toggle('active', this.isOpen);
        if (this.isOpen) {
            this.input.focus();
            this.scrollToBottom();
            // Refresh context on open
            this.context = this.detectContext();
        }
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    async sendMessage() {
        const text = this.input.value.trim();
        if (!text) return;

        // Clear input
        this.input.value = '';

        // Add User Message
        this.addMessage('user', text);
        this.messages.push({ role: 'user', content: text, timestamp: Date.now() });

        // Show Typing Indicator
        const typingId = this.showTyping();

        try {
            // Prepare Payload
            const payload = {
                messages: this.messages,
                context: this.context
            };

            const res = await fetch(`${this.baseUrl}/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            // Remove Typing Indicator
            this.removeTyping(typingId);

            if (data.content) {
                this.addMessage('ai', data.content);
                this.messages.push({ role: 'assistant', content: data.content, timestamp: Date.now() });
            } else {
                this.addMessage('ai', "Details unavailable.");
            }

        } catch (err) {
            this.removeTyping(typingId);
            this.addMessage('ai', "⚠️ Connection Lost. Please check your network.");
            console.error(err);
        }
    }

    addMessage(role, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `msg ${role}`;

        // Simple Markdown Parsing using Regex
        let html = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/`([^`]+)`/g, '<code>$1</code>') // Inline Code
            .replace(/\n/g, '<br>'); // Newlines

        msgDiv.innerHTML = html;
        this.messagesContainer.appendChild(msgDiv);
        this.scrollToBottom();
    }

    showTyping() {
        const id = 'typing-' + Date.now();
        const div = document.createElement('div');
        div.className = 'msg ai typing';
        div.id = id;
        div.innerHTML = `
            <div class="typing-dots">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
        `;
        this.messagesContainer.appendChild(div);
        this.scrollToBottom();
        return id;
    }

    removeTyping(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }
}

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
    // Only init if user is logged in
    if (localStorage.getItem('user')) {
        window.aiMentor = new AIMentorChat();
    }
});
