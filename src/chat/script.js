let currentChatId = null;
let chatHistory = [];
let isChatTitleGenerated = false;
let isAssistantResponding = false;
let controller = null;

const chatArea = document.getElementById("chatArea");
const chatTitle = document.getElementById("chatTitle");
const chatHistoryEl = document.getElementById("chatHistory");
const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");
const regenerateBtn = document.getElementById("regenerateBtn");
const notification = document.getElementById("notification");
const tpsDisplay = document.getElementById("tpsDisplay");
const timeTakenDisplay = document.getElementById("timeTakenDisplay");

function startNewChat() {
    if (isAssistantResponding) {
        showNotification("Please wait for the current response to finish before starting a new chat.");
        return;
    }

    currentChatId = Date.now().toString();
    chatArea.innerHTML = "";
    chatTitle.textContent = "AI Assistant";
    isChatTitleGenerated = false;
    hideRegenerateButton();
    updateChatHistory();
}

function updateChatHistory() {
    chatHistoryEl.innerHTML = "";
    chatHistory.forEach((chat, index) => {
        const li = createChatHistoryItem(chat, index);
        chatHistoryEl.appendChild(li);
    });

    initSortable();
}

function createChatHistoryItem(chat, index) {
    const li = document.createElement("li");
    li.className = "chat-history-item";
    li.dataset.id = chat.id;

    const chatTitleElement = document.createElement("span");
    chatTitleElement.className = "chat-title";
    chatTitleElement.textContent = chat.title || `Chat ${index + 1}`;
    chatTitleElement.onclick = () => loadChat(chat.id);
    li.appendChild(chatTitleElement);

    const deleteBtn = createDeleteButton(chat.id, li);
    li.appendChild(deleteBtn);

    return li;
}

function createDeleteButton(chatId, listItem) {
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "delete-btn";
    let deleteConfirmTimeout;

    deleteBtn.onclick = (event) => {
        event.stopPropagation();
        if (deleteBtn.classList.contains("confirm")) {
            clearTimeout(deleteConfirmTimeout);
            deleteChat(chatId, listItem);
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
}

function initSortable() {
    if (window.sortableInstance) {
        window.sortableInstance.destroy();
    }
    
    window.sortableInstance = new Sortable(chatHistoryEl, {
        animation: 150,
        handle: ".chat-title",
        onEnd: function(evt) {
            const itemEl = evt.item;
            const newIndex = evt.newIndex;
            const chatId = itemEl.dataset.id;
            
            const chatIndex = chatHistory.findIndex(chat => chat.id === chatId);
            if (chatIndex !== -1) {
                const [chat] = chatHistory.splice(chatIndex, 1);
                chatHistory.splice(newIndex, 0, chat);
            }
            
            updateChatHistory();
        }
    });
}

function deleteChat(chatId, listItem) {
    listItem.style.animation = "deleteAnimation 0.5s forwards";
    setTimeout(() => {
        chatHistory = chatHistory.filter((chat) => chat.id !== chatId);
        updateChatHistory();
        if (currentChatId === chatId) {
            startNewChat();
        }
    }, 500);
}

function loadChat(chatId) {
    if (isAssistantResponding) {
        showNotification("Please wait for the current response to finish before loading another chat.");
        return;
    }

    currentChatId = chatId;
    const chat = chatHistory.find((c) => c.id === chatId);
    chatArea.innerHTML = "";
    chatTitle.textContent = chat.title || "AI Assistant";
    chat.messages.forEach((msg) => {
        appendMessage(msg.role, msg.content, msg.timestamp);
    });
}

function addCopyButtonToCodeBlocks() {
    const codeBlocks = document.querySelectorAll('pre');
    let newButtonsAdded = 0;

    codeBlocks.forEach((block) => {
        if (!block.querySelector('.copy-code-btn')) {
            const button = createCopyCodeButton(block);
            block.insertBefore(button, block.firstChild);
            newButtonsAdded++;
        }
    });

    if (newButtonsAdded > 0) {
        console.log(`Added ${newButtonsAdded} new copy button(s) to code blocks`);
    }
}

function createCopyCodeButton(block) {
    const button = document.createElement('button');
    button.className = 'copy-code-btn';
    button.textContent = 'Copy';
    button.style.zIndex = '1000';
    button.style.display = 'block';

    button.addEventListener('click', function() {
        const code = block.querySelector('code').textContent;
        navigator.clipboard.writeText(code).then(() => {
            showNotification('Code copied to clipboard!');
            button.textContent = 'Copied!';
            setTimeout(() => {
                button.textContent = 'Copy';
            }, 2000);
        }, (err) => {
            console.error('Failed to copy code: ', err);
            showNotification('Failed to copy code');
        });
    });

    return button;
}

function appendMessage(role, content, timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${role === "user" ? "user-message" : "bot-message"}`;

    const iconDiv = document.createElement("div");
    iconDiv.className = "profile-icon";
    iconDiv.style.backgroundImage = `url('${role === "user" ? "https://i.imgur.com/6VBx3io.png" : "https://i.imgur.com/EN1RnD2.png"}')`;
    messageDiv.appendChild(iconDiv);

    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";
    contentDiv.innerHTML = DOMPurify.sanitize(marked.parse(content));

    messageDiv.appendChild(contentDiv);

    contentDiv.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightBlock(block);
        const copyBtn = createCopyCodeButton(block.parentNode);
        block.parentNode.insertBefore(copyBtn, block);
    });

    const timestampDiv = document.createElement("div");
    timestampDiv.className = "timestamp";
    timestampDiv.textContent = timestamp;
    contentDiv.appendChild(timestampDiv);

    if (role === "user") {
        contentDiv.appendChild(createCopyMessageButton(content));
        contentDiv.appendChild(createDeleteMessageButton(messageDiv, content));
    }

    chatArea.appendChild(messageDiv);
    chatArea.scrollTop = chatArea.scrollHeight;

    contentDiv.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightBlock(block);
    });

    addCopyButtonToCodeBlocks();

    if (role === "assistant") {
        showRegenerateButton();
    }
}

function createCopyMessageButton(content) {
    const copyBtn = document.createElement("button");
    copyBtn.textContent = "Copy";
    copyBtn.className = "copy-btn";
    copyBtn.onclick = () => {
        navigator.clipboard.writeText(content);
        showNotification("Message copied to clipboard!");
    };
    return copyBtn;
}

function createDeleteMessageButton(messageDiv, content) {
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "delete-msg-btn";
    deleteBtn.onclick = () => {
        messageDiv.remove();
        const chat = chatHistory.find((c) => c.id === currentChatId);
        if (chat) {
            chat.messages = chat.messages.filter((m) => m.content !== content);
        }
    };
    return deleteBtn;
}

function showRegenerateButton() {
    regenerateBtn.classList.add("visible");
}

function hideRegenerateButton() {
    regenerateBtn.classList.remove("visible");
}

async function updateTitleWithAnimation(title) {
    chatTitle.textContent = "";
    for (let i = 0; i < title.length; i++) {
        chatTitle.textContent += title[i];
        await new Promise((resolve) => setTimeout(resolve, 50));
    }
}

async function generateChatTitle() {
    const currentChat = chatHistory.find((c) => c.id === currentChatId);
    if (currentChat.messages.length >= 2 && !isChatTitleGenerated) {
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
            await updateTitleWithAnimation(limitedTitle);
            isChatTitleGenerated = true;
            updateChatHistory();
        } catch (titleError) {
            console.error("Error generating title:", titleError);
            const fallbackTitle = userFirstMessage.split(' ').slice(0, 5).join(' ');
            currentChat.title = fallbackTitle;
            await updateTitleWithAnimation(fallbackTitle);
            isChatTitleGenerated = true;
            updateChatHistory();
        }
    }
}

async function sendMessage(isRegenerating = false) {
    if (isAssistantResponding) {
        showNotification("Please wait for the current response to finish.");
        return;
    }

    const userMessage = isRegenerating ? chatHistory.find((c) => c.id === currentChatId).messages.slice(-1)[0].content : userInput.value.trim();

    if (userMessage !== "") {
        if (!currentChatId) {
            startNewChat();
        }

        if (!isRegenerating) {
            appendUserMessage(userMessage);
        }

        userInput.value = "";
        disableInput();

        isAssistantResponding = true;

        try {
            await fetchAssistantResponse(userMessage);
        } catch (error) {
            console.error("Error:", error);
            appendMessage(
                "bot",
                "I apologize, but I'm having trouble connecting. Please try again later."
            );
        } finally {
            enableInput();
        }
    }
}

async function fetchAssistantResponse(userMessage) {
    const startTime = Date.now();

    const response = await fetch('/.netlify/functions/chat-generateMessage', {
        method: 'POST',
        body: JSON.stringify({
            messages: chatHistory.find((c) => c.id === currentChatId).messages
        }),
    });

    console.log("Response from fetch: ", response);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    await streamAndDisplayBotResponse(response, startTime);
    await generateChatTitle();
    updateChatHistory();
    showRegenerateButton();
}

function appendUserMessage(userMessage) {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    appendMessage("user", userMessage, timestamp);

    let currentChat = chatHistory.find((c) => c.id === currentChatId);
    if (!currentChat) {
        currentChat = {
            id: currentChatId,
            messages: [],
            title: null
        };
        chatHistory.push(currentChat);
    }
    currentChat.messages.push({
        role: "user",
        content: userMessage,
        timestamp
    });
}

function disableInput() {
    userInput.disabled = true;
    sendButton.disabled = true;
    sendButton.classList.add("loading");
    regenerateBtn.disabled = true;
}

function enableInput() {
    isAssistantResponding = false;
    sendButton.classList.remove("loading");
    userInput.disabled = false;
    sendButton.disabled = false;
    regenerateBtn.disabled = false;
    userInput.focus();
}

async function streamAndDisplayBotResponse(response, startTime) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let botReply = "";
    let hasValidContent = false;
    const botMessageDiv = createBotMessageDiv();

    try {
        await processStream(reader, decoder, (content) => {
            botReply += content;
            hasValidContent = true;
            updateBotMessageContent(botMessageDiv, botReply);
        });
    } catch (error) {
        console.error("Error reading stream:", error);
    }

    finalizeBotMessage(botMessageDiv, botReply, startTime, hasValidContent);
}

async function processStream(reader, decoder, onContent) {
    let buffer = '';
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop();

        lines.forEach(line => processLine(line, onContent));
    }
    if (buffer) processLine(buffer, onContent);
}

function processChunk(chunk, onContent) {
    const lines = chunk.split('\n');
    lines.forEach(line => processLine(line, onContent));
}

function processLine(line, onContent) {
    if (!line.startsWith('data: ')) return;

    const jsonData = line.slice(6).trim();
    if (jsonData === '[DONE]') return;

    try {
        const parsedData = JSON.parse(jsonData);
        const content = extractContent(parsedData);
        if (content) onContent(content);
    } catch (error) {
        console.warn("Failed to parse JSON:", jsonData, error);
    }
}

function extractContent(parsedData) {
    const choices = parsedData.choices;
    if (Array.isArray(choices) && choices.length > 0) {
        const delta = choices[0].delta;
        if (delta && delta.content) {
            return delta.content;  // Remove trim() to preserve spaces
        }
    }
    return "";
}

function createBotMessageDiv() {
    const botMessageDiv = document.createElement("div");
    botMessageDiv.className = "message bot-message";
    const botIcon = document.createElement("div");
    botIcon.className = "profile-icon";
    botIcon.style.backgroundImage = "url('https://i.imgur.com/EN1RnD2.png')";
    botMessageDiv.appendChild(botIcon);

    const botContentDiv = document.createElement("div");
    botContentDiv.className = "message-content";
    botMessageDiv.appendChild(botContentDiv);
    chatArea.appendChild(botMessageDiv);
    return botMessageDiv;
}

function updateBotMessageContent(botMessageDiv, botReply) {
    const botContentDiv = botMessageDiv.querySelector(".message-content");
    botContentDiv.innerHTML = DOMPurify.sanitize(marked.parse(botReply));
    chatArea.scrollTop = chatArea.scrollHeight;
}

function finalizeBotMessage(botMessageDiv, botReply, startTime, hasValidContent) {
    const botContentDiv = botMessageDiv.querySelector(".message-content");
    
    botReply = hasValidContent ? botReply.trim() : "Sorry, the assistant did not generate a valid reply.";
    if (botReply === "") botReply = "The assistant generated an empty response.";

    botContentDiv.innerHTML = DOMPurify.sanitize(marked.parse(botReply));

    addCopyButtonToCodeBlocks();
    chatArea.scrollTop = chatArea.scrollHeight;

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    const wordCount = botReply.split(/\s+/).length;
    const tps = Math.round(wordCount / duration);

    updateMetrics(tps, duration);
    appendTimestampAndButtons(botContentDiv, botReply);
    logChatHistory(botReply);
}

function updateMetrics(tps, duration) {
    tpsDisplay.textContent = `TPS: ${tps}`;
    timeTakenDisplay.textContent = `Time Taken: ${duration.toFixed(2)}s`;
}

function appendTimestampAndButtons(botContentDiv, botReply) {
    const botTimestamp = document.createElement("div");
    botTimestamp.className = "timestamp";
    botTimestamp.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    botContentDiv.appendChild(botTimestamp);
    
    botContentDiv.appendChild(createCopyMessageButton(botReply));
    botContentDiv.appendChild(createDeleteMessageButton(botContentDiv.parentNode, botReply));
}

function logChatHistory(botReply) {
    chatHistory
        .find((c) => c.id === currentChatId)
        .messages.push({
            role: "assistant",
            content: botReply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });

    console.log("Final bot message logged in chat history:", botReply);
}

function showSettings() {
    console.log("Settings button clicked");
}

function regenerateResponse() {
    if (isAssistantResponding) {
        showNotification("Please wait for the current response to finish before regenerating.");
        return;
    }

    const lastBotMessage = chatArea.querySelector(".bot-message:last-of-type");
    if (lastBotMessage) {
        lastBotMessage.remove();
        const chat = chatHistory.find((c) => c.id === currentChatId);
        if (chat) {
            chat.messages.pop();
        }
        sendMessage(true);
    }
}

function showNotification(message) {
    notification.textContent = message;
    notification.classList.add("visible");
    setTimeout(() => {
        notification.classList.remove("visible");
    }, 3000);
}

function handleUserInput(event) {
    if (event.shiftKey && event.key === " ") {
        event.preventDefault();
        const cursorPos = userInput.selectionStart;
        userInput.value = userInput.value.slice(0, cursorPos) + "\n" + userInput.value.slice(cursorPos);
        userInput.selectionStart = userInput.selectionEnd = cursorPos + 1;
    } else if (!event.shiftKey && event.key === "Enter") {
        event.preventDefault();
        sendMessage();
    }
}

function handleSendButtonClick() {
    if (isAssistantResponding) {
        showNotification("Response is still ongoing.");
    } else {
        sendMessage();
    }
}

function handleNewChatButtonClick() {
    if (isAssistantResponding) {
        showNotification("Please wait for the current response to finish before starting a new chat.");
    } else {
        startNewChat();
    }
}

// Event Listeners
userInput.addEventListener("keypress", handleUserInput);
sendButton.addEventListener("click", handleSendButtonClick);
document.getElementById("newChatBtn").addEventListener("click", handleNewChatButtonClick);

document.addEventListener('DOMContentLoaded', (event) => {
    addCopyButtonToCodeBlocks();
});

// Initialize
startNewChat();

// MutationObserver setup
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            const addedPres = Array.from(mutation.addedNodes).filter(node => node.tagName === 'PRE');
            if (addedPres.length > 0) {
                addCopyButtonToCodeBlocks();
            }
        }
    });
});

observer.observe(chatArea, {
    childList: true,
    subtree: true
});