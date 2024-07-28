// Constants and cache DOM elements for better performance
const DOM = {
    chatArea: document.getElementById("chatArea"),
    chatTitle: document.getElementById("chatTitle"),
    chatHistoryEl: document.getElementById("chatHistory"),
    userInput: document.getElementById("userInput"),
    sendButton: document.getElementById("sendButton"),
    regenerateBtn: document.getElementById("regenerateBtn"),
    notification: document.getElementById("notification"),
    tpsDisplay: document.getElementById("tpsDisplay"),
    timeTakenDisplay: document.getElementById("timeTakenDisplay"),
    newChatBtn: document.getElementById("newChatBtn")
};

// State management
const State = {
    currentChatId: null,
    chatHistory: [],
    isChatTitleGenerated: false,
    isAssistantResponding: false,
    controller: null
};

// Utility functions
const Util = {
    debounce: (func, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func(...args), delay);
        };
    },
    sanitizeHTML: (html) => DOMPurify.sanitize(html),
    generateUniqueId: () => `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
};

// Chat management functions
const ChatManager = {
    startNewChat: () => {
        if (State.isAssistantResponding) {
            UI.showNotification("Please wait for the current response to finish before starting a new chat.");
            return;
        }

        State.currentChatId = Util.generateUniqueId();
        DOM.chatArea.innerHTML = "";
        DOM.chatTitle.textContent = "AI Assistant";
        State.isChatTitleGenerated = false;
        UI.hideRegenerateButton();
        ChatManager.updateChatHistory();
    },

    updateChatHistory: () => {
        DOM.chatHistoryEl.innerHTML = "";
        State.chatHistory.forEach((chat, index) => {
            const li = ChatManager.createChatHistoryItem(chat, index);
            DOM.chatHistoryEl.appendChild(li);
        });

        ChatManager.initSortable();
    },

    createChatHistoryItem: (chat, index) => {
        const li = document.createElement("li");
        li.className = "chat-history-item";
        li.dataset.id = chat.id;

        const chatTitleElement = document.createElement("span");
        chatTitleElement.className = "chat-title";
        chatTitleElement.textContent = chat.title || `Chat ${index + 1}`;
        chatTitleElement.onclick = () => ChatManager.loadChat(chat.id);
        li.appendChild(chatTitleElement);

        const deleteBtn = ChatManager.createDeleteButton(chat.id, li);
        li.appendChild(deleteBtn);

        return li;
    },

    createDeleteButton: (chatId, listItem) => {
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.className = "delete-btn";
        let deleteConfirmTimeout;

        deleteBtn.onclick = (event) => {
            event.stopPropagation();
            if (deleteBtn.classList.contains("confirm")) {
                clearTimeout(deleteConfirmTimeout);
                ChatManager.deleteChat(chatId, listItem);
            } else {
                deleteBtn.textContent = "Sure?";
                deleteBtn.classList.add("confirm");
                deleteConfirmTimeout = setTimeout(() => {
                    deleteBtn.textContent = "Delete";
                    deleteBtn.classList.remove("confirm");
                }, 2000);
            }
        };

        return deleteBtn;
    },

    initSortable: () => {
        if (window.sortableInstance) {
            window.sortableInstance.destroy();
        }
        
        window.sortableInstance = new Sortable(DOM.chatHistoryEl, {
            animation: 150,
            handle: ".chat-title",
            onEnd: function(evt) {
                const itemEl = evt.item;
                const newIndex = evt.newIndex;
                const chatId = itemEl.dataset.id;
                
                const chatIndex = State.chatHistory.findIndex(chat => chat.id === chatId);
                if (chatIndex !== -1) {
                    const [chat] = State.chatHistory.splice(chatIndex, 1);
                    State.chatHistory.splice(newIndex, 0, chat);
                }
                
                ChatManager.updateChatHistory();
            }
        });
    },

    deleteChat: (chatId, listItem) => {
        listItem.style.animation = "deleteAnimation 0.5s forwards";
        setTimeout(() => {
            State.chatHistory = State.chatHistory.filter((chat) => chat.id !== chatId);
            ChatManager.updateChatHistory();
            if (State.currentChatId === chatId) {
                ChatManager.startNewChat();
            }
        }, 500);
    },

    loadChat: (chatId) => {
        if (State.isAssistantResponding) {
            UI.showNotification("Please wait for the current response to finish before loading another chat.");
            return;
        }

        State.currentChatId = chatId;
        const chat = State.chatHistory.find((c) => c.id === chatId);
        DOM.chatArea.innerHTML = "";
        DOM.chatTitle.textContent = chat.title || "AI Assistant";
        chat.messages.forEach((msg) => {
            UI.appendMessage(msg.role, msg.content, msg.timestamp);
        });
    }
};

// UI management functions
const UI = {
    addCopyButtonToCodeBlocks: () => {
        const codeBlocks = DOM.chatArea.querySelectorAll('pre');
        let newButtonsAdded = 0;

        codeBlocks.forEach((block) => {
            if (!block.querySelector('.copy-code-btn')) {
                const button = UI.createCopyCodeButton(block);
                block.insertBefore(button, block.firstChild);
                newButtonsAdded++;
            }
        });

        if (newButtonsAdded > 0) {
            console.log(`Added ${newButtonsAdded} new copy button(s) to code blocks`);
        }
    },

    createCopyCodeButton: (block) => {
        const button = document.createElement('button');
        button.className = 'copy-code-btn';
        button.textContent = 'Copy';
        button.style.zIndex = '1000';
        button.style.display = 'block';

        button.addEventListener('click', function() {
            const code = block.querySelector('code').textContent;
            navigator.clipboard.writeText(code).then(() => {
                UI.showNotification('Code copied to clipboard!');
                button.textContent = 'Copied!';
                setTimeout(() => {
                    button.textContent = 'Copy';
                }, 2000);
            }, (err) => {
                console.error('Failed to copy code: ', err);
                UI.showNotification('Failed to copy code');
            });
        });

        return button;
    },

    appendMessage: (role, content, timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) => {
        const messageDiv = document.createElement("div");
        messageDiv.className = `message ${role === "user" ? "user-message" : "bot-message"}`;

        const iconDiv = document.createElement("div");
        iconDiv.className = "profile-icon";
        iconDiv.style.backgroundImage = `url('${role === "user" ? "https://i.imgur.com/6VBx3io.png" : "https://i.imgur.com/EN1RnD2.png"}')`;
        messageDiv.appendChild(iconDiv);

        const contentDiv = document.createElement("div");
        contentDiv.className = "message-content";
        contentDiv.innerHTML = Util.sanitizeHTML(marked.parse(content));

        messageDiv.appendChild(contentDiv);

        contentDiv.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightBlock(block);
            const copyBtn = UI.createCopyCodeButton(block.parentNode);
            block.parentNode.insertBefore(copyBtn, block);
        });

        const timestampDiv = document.createElement("div");
        timestampDiv.className = "timestamp";
        timestampDiv.textContent = timestamp;
        contentDiv.appendChild(timestampDiv);

        if (role === "user") {
            contentDiv.appendChild(UI.createCopyMessageButton(content));
            contentDiv.appendChild(UI.createDeleteMessageButton(messageDiv, content));
        }

        DOM.chatArea.appendChild(messageDiv);
        DOM.chatArea.scrollTop = DOM.chatArea.scrollHeight;

        contentDiv.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightBlock(block);
        });

        UI.addCopyButtonToCodeBlocks();

        if (role === "assistant") {
            UI.showRegenerateButton();
        }

        return messageDiv;
    },

    createCopyMessageButton: (content) => {
        const copyBtn = document.createElement("button");
        copyBtn.textContent = "Copy";
        copyBtn.className = "copy-btn";
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(content);
            UI.showNotification("Message copied to clipboard!");
        };
        return copyBtn;
    },

    createDeleteMessageButton: (messageDiv, content) => {
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.className = "delete-msg-btn";
        deleteBtn.onclick = () => {
            messageDiv.remove();
            const chat = State.chatHistory.find((c) => c.id === State.currentChatId);
            if (chat) {
                chat.messages = chat.messages.filter((m) => m.content !== content);
            }
        };
        return deleteBtn;
    },

    showRegenerateButton: () => {
        DOM.regenerateBtn.classList.add("visible");
        DOM.regenerateBtn.disabled = false; // Enable the button
    },

    hideRegenerateButton: () => {
        DOM.regenerateBtn.classList.remove("visible");
        DOM.regenerateBtn.disabled = true; // Disable the button
    },

    updateTitleWithAnimation: async (title) => {
        DOM.chatTitle.textContent = "";
        for (let i = 0; i < title.length; i++) {
            DOM.chatTitle.textContent += title[i];
            await new Promise((resolve) => setTimeout(resolve, 50));
        }
    },

    showNotification: (message) => {
        DOM.notification.textContent = message;
        DOM.notification.classList.add("visible");
        setTimeout(() => {
            DOM.notification.classList.remove("visible");
        }, 3000);
    },

    disableInput: () => {
        DOM.userInput.disabled = true;
        DOM.sendButton.disabled = true;
        DOM.sendButton.classList.add("loading");
        DOM.regenerateBtn.disabled = true;
    },

    enableInput: () => {
        State.isAssistantResponding = false;
        DOM.sendButton.classList.remove("loading");
        DOM.userInput.disabled = false;
        DOM.sendButton.disabled = false;
        DOM.regenerateBtn.disabled = false;
        DOM.userInput.focus();
    },

    updateMetrics: (tps, duration) => {
        DOM.tpsDisplay.textContent = `TPS: ${tps}`;
        DOM.timeTakenDisplay.textContent = `Time Taken: ${duration.toFixed(2)}s`;
    },

    createBotMessageDiv: () => {
        const botMessageDiv = document.createElement("div");
        botMessageDiv.className = "message bot-message";
        const botIcon = document.createElement("div");
        botIcon.className = "profile-icon";
        botIcon.style.backgroundImage = "url('https://i.imgur.com/EN1RnD2.png')";
        botMessageDiv.appendChild(botIcon);

        const botContentDiv = document.createElement("div");
        botContentDiv.className = "message-content";
        botMessageDiv.appendChild(botContentDiv);
        DOM.chatArea.appendChild(botMessageDiv);
        return botMessageDiv;
    },

    updateBotMessageContent: (botMessageDiv, content) => {
        const botContentDiv = botMessageDiv.querySelector(".message-content");
        botContentDiv.innerHTML = Util.sanitizeHTML(marked.parse(content));
        DOM.chatArea.scrollTop = DOM.chatArea.scrollHeight;
    },
};

// API interaction functions
const API = {
    generateChatTitle: async () => {
        const currentChat = State.chatHistory.find((c) => c.id === State.currentChatId);
        if (currentChat.messages.length >= 2 && !State.isChatTitleGenerated) {
            const userFirstMessage = currentChat.messages[0].content;
            const assistantFirstMessage = currentChat.messages[1].content;

            try {
                const response = await fetch('/.netlify/functions/chat-generateTitle', {
                    method: 'POST',
                    body: JSON.stringify({ userFirstMessage, assistantFirstMessage }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                const limitedTitle = data.title;

                currentChat.title = limitedTitle;
                await UI.updateTitleWithAnimation(limitedTitle);
                State.isChatTitleGenerated = true;
                ChatManager.updateChatHistory();
            } catch (titleError) {
                console.error("Error generating title:", titleError);
                const fallbackTitle = userFirstMessage.split(' ').slice(0, 5).join(' ');
                currentChat.title = fallbackTitle;
                await UI.updateTitleWithAnimation(fallbackTitle);
                State.isChatTitleGenerated = true;
                ChatManager.updateChatHistory();
            }
        }
    },

    fetchAssistantResponse: async (userMessage) => {
        const startTime = Date.now();
    
        try {
            const response = await API.fetchAssistantResponseFromAPI(userMessage);
            const botMessageDiv = UI.createBotMessageDiv();
            let botReply = "";
    
            await API.processStream(
                response.body.getReader(),
                new TextDecoder(),
                (content) => {
                    botReply += content;
                    UI.updateBotMessageContent(botMessageDiv, botReply);
                }
            );
    
            API.finalizeBotMessage(botMessageDiv, botReply, startTime);
            await API.generateChatTitle();
            ChatManager.updateChatHistory();
            UI.showRegenerateButton();
        } catch (error) {
            API.handleFetchError(error);
        } finally {
            UI.enableInput();
        }
    },
    
    fetchAssistantResponseFromAPI: async (userMessage) => {
        const response = await fetch('/.netlify/functions/chatProxy', {
            method: 'POST',
            body: JSON.stringify({
                messages: State.chatHistory.find((c) => c.id === State.currentChatId).messages
            }),
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream'
            }
        });
    
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    
        return response;
    },

    processStream: async (reader, decoder, onContent) => {
        let buffer = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
    
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            const lines = buffer.split('\n');
            buffer = lines.pop();
    
            lines.forEach(line => API.processLine(line, onContent));
        }
        if (buffer) API.processLine(buffer, onContent);
    },

    processLine: (line, onContent) => {
        if (!line.startsWith('data: ')) return;
    
        const jsonData = line.slice(6).trim();
        if (jsonData === '[DONE]') return;
    
        try {
            const parsedData = JSON.parse(jsonData);
            const content = API.extractContent(parsedData);
            if (content) onContent(content);
        } catch (error) {
            console.warn("Failed to parse JSON:", jsonData, error);
        }
    },

    extractContent: (parsedData) => {
        if (parsedData.choices && parsedData.choices.length > 0) {
            const delta = parsedData.choices[0].delta;
            if (delta && delta.content) {
                return delta.content;
            }
        }
        return "";
    },

    finalizeBotMessage: (botMessageDiv, botReply, startTime) => {
        const botContentDiv = botMessageDiv.querySelector(".message-content");
    
        botReply = botReply.trim() || "The assistant generated an empty response.";
    
        botContentDiv.innerHTML = Util.sanitizeHTML(marked.parse(botReply));
    
        UI.addCopyButtonToCodeBlocks();
        DOM.chatArea.scrollTop = DOM.chatArea.scrollHeight;
    
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        const wordCount = botReply.split(/\s+/).length;
        const tps = Math.round(wordCount / duration);
    
        UI.updateMetrics(tps, duration);
        API.appendTimestampAndButtons(botContentDiv, botReply);
        API.logChatHistory(botReply);
    },

    appendTimestampAndButtons: (botContentDiv, botReply) => {
        const botTimestamp = document.createElement("div");
        botTimestamp.className = "timestamp";
        botTimestamp.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        botContentDiv.appendChild(botTimestamp);
        
        botContentDiv.appendChild(UI.createCopyMessageButton(botReply));
        botContentDiv.appendChild(UI.createDeleteMessageButton(botContentDiv.parentNode, botReply));
    },

    logChatHistory: (botReply) => {
        State.chatHistory
            .find((c) => c.id === State.currentChatId)
            .messages.push({
                role: "assistant",
                content: botReply,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });

        console.log("Final bot message logged in chat history:", botReply);
    },

    handleFetchError: (error) => {
        console.error("Error in fetchAssistantResponse:", error);
        UI.appendMessage(
            "bot",
            "I apologize, but I'm having trouble generating a response. Please try again later."
        );
    },
};

// Event handlers
const EventHandlers = {
    handleUserInput: (event) => {
        if (event.shiftKey && event.key === " ") {
            event.preventDefault();
            const cursorPos = DOM.userInput.selectionStart;
            DOM.userInput.value = DOM.userInput.value.slice(0, cursorPos) + "\n" + DOM.userInput.value.slice(cursorPos);
            DOM.userInput.selectionStart = DOM.userInput.selectionEnd = cursorPos + 1;
        } else if (!event.shiftKey && event.key === "Enter") {
            event.preventDefault();
            EventHandlers.sendMessage();
        }
    },

    handleSendButtonClick: () => {
        if (State.isAssistantResponding) {
            UI.showNotification("Response is still ongoing.");
        } else {
            EventHandlers.sendMessage();
        }
    },

    handleNewChatButtonClick: () => {
        if (State.isAssistantResponding) {
            UI.showNotification("Please wait for the current response to finish before starting a new chat.");
        } else {
            ChatManager.startNewChat();
        }
    },

    sendMessage: async (isRegenerating = false) => {
        if (State.isAssistantResponding) {
            UI.showNotification("Please wait for the current response to finish.");
            return;
        }

        const userMessage = isRegenerating ? 
            State.chatHistory.find((c) => c.id === State.currentChatId).messages.slice(-1)[0].content : 
            DOM.userInput.value.trim();

        if (userMessage !== "") {
            if (!State.currentChatId) {
                ChatManager.startNewChat();
            }

            if (!isRegenerating) {
                EventHandlers.appendUserMessage(userMessage);
            }

            DOM.userInput.value = "";
            UI.disableInput();

            State.isAssistantResponding = true;

            try {
                await API.fetchAssistantResponse(userMessage);
            } catch (error) {
                console.error("Error:", error);
                UI.appendMessage(
                    "bot",
                    "I apologize, but I'm having trouble connecting. Please try again later."
                );
            } finally {
                UI.enableInput();
            }
        }
    },

    appendUserMessage: (userMessage) => {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        UI.appendMessage("user", userMessage, timestamp);

        let currentChat = State.chatHistory.find((c) => c.id === State.currentChatId);
        if (!currentChat) {
            currentChat = {
                id: State.currentChatId,
                messages: [],
                title: null
            };
            State.chatHistory.push(currentChat);
        }
        currentChat.messages.push({
            role: "user",
            content: userMessage,
            timestamp
        });
    },

    regenerateResponse: () => {
        if (State.isAssistantResponding || !DOM.regenerateBtn.classList.contains("visible")) {
            return; // Don't do anything if the button is not visible
        }

        const lastBotMessage = DOM.chatArea.querySelector(".bot-message:last-of-type");
        if (lastBotMessage) {
            lastBotMessage.remove();
            const chat = State.chatHistory.find((c) => c.id === State.currentChatId);
            if (chat) {
                chat.messages.pop();
            }
            EventHandlers.sendMessage(true);
        }
    }
};

// Initialize the application
const init = () => {
    // Set up event listeners
    DOM.userInput.addEventListener("keypress", EventHandlers.handleUserInput);
    DOM.sendButton.addEventListener("click", EventHandlers.handleSendButtonClick);
    DOM.newChatBtn.addEventListener("click", EventHandlers.handleNewChatButtonClick);
    DOM.regenerateBtn.addEventListener("click", EventHandlers.regenerateResponse);
    UI.hideRegenerateButton();
    
    // Set up MutationObserver
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                const addedPres = Array.from(mutation.addedNodes).filter(node => node.tagName === 'PRE');
                if (addedPres.length > 0) {
                    UI.addCopyButtonToCodeBlocks();
                }
            }
        });
    });

    observer.observe(DOM.chatArea, {
        childList: true,
        subtree: true
    });

    // Start a new chat
    ChatManager.startNewChat();
};

// Run the initialization
document.addEventListener('DOMContentLoaded', init);