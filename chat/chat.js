import FileText from 'https://unpkg.com/lucide@latest/dist/esm/icons/file-text.js';

const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const errorLog = document.getElementById('error-log');
const conversationList = document.getElementById('conversation-list');
const newChatBtn = document.getElementById('new-chat-btn');
const themeToggle = document.getElementById('theme-toggle');
const fileUploadButton = document.getElementById('file-upload-button');
const fileUploadInput = document.getElementById('file-upload');
const fileList = document.getElementById('file-list');
const fileProgress = document.getElementById('file-progress');
const sendMessageButton = document.getElementById('send-message');
const modelSelect = document.getElementById('model-select');
const modelDropdown = document.querySelector('.model-dropdown');
const conversationTitle = document.getElementById('conversation-title');
const toggleSidebarBtn = document.getElementById('toggle-sidebar');
const sidebar = document.getElementById('sidebar');
const main = document.getElementById('main');
const copyright = document.getElementById('copyright');

let conversations = [];
let currentConversation = null;
let uploadedFiles = [];
let currentModel = 'claude-3-5-sonnet-20240620';
let isDropdownOpen = false;
let isSending = false;
let isSidebarVisible = true;
let abortController = null;

function createNewConversation() {
    const isInitialConversation = conversations.length === 0;
    if (isInitialConversation || (currentConversation && currentConversation.messages.length > 0)) {
        currentConversation = {
            id: Date.now(),
            title: "New Conversation",
            messages: [],
            model: currentModel,
            hasCustomTitle: false
        };
        conversations.unshift(currentConversation);
        updateConversationList();
        clearChatContainer();
        updateConversationTitle();
    }
}

function updateConversationList() {
    conversationList.innerHTML = '';
    conversations.forEach(conv => {
        const item = document.createElement('div');
        item.classList.add('sidebar-item');
        item.textContent = conv.title;
        item.onclick = () => loadConversation(conv);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete-chat');
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            if (deleteBtn.classList.contains('delete-confirm')) {
                deleteConversation(conv);
            } else {
                deleteBtn.textContent = 'Sure?';
                deleteBtn.classList.add('delete-confirm');
                setTimeout(() => {
                    deleteBtn.innerHTML = '🗑️';
                    deleteBtn.classList.remove('delete-confirm');
                }, 2000);
            }
        };
        
        item.appendChild(deleteBtn);
        conversationList.appendChild(item);
    });

    new Sortable(conversationList, {
        animation: 150,
        ghostClass: 'sortable-ghost'
    });
}

function deleteConversation(conv) {
    const index = conversations.indexOf(conv);
    if (index > -1) {
        const item = conversationList.children[index];
        item.classList.add('deleting');
        setTimeout(() => {
            conversations.splice(index, 1);
            updateConversationList();
            if (currentConversation === conv) {
                createNewConversation();
            }
        }, 300);
    }
}

function loadConversation(conversation) {
    currentConversation = conversation;
    clearChatContainer();
    conversation.messages.forEach(msg => addMessage(msg.role, msg.content, msg.files));
    updateConversationTitle();
}

function clearChatContainer() {
    chatContainer.innerHTML = '';
}

function addMessage(role, content, files = []) {
    // Create a message container
    let messageDiv = document.querySelector(`.message.${role}:last-child`);

    if (!messageDiv) {
        messageDiv = document.createElement('div');
        messageDiv.classList.add('message', role);

        const iconDiv = document.createElement('div');
        iconDiv.classList.add('message-icon');
        iconDiv.textContent = role === 'user' ? 'U' : 'A';

        const contentWrapper = document.createElement('div');
        contentWrapper.classList.add('message-content-wrapper');

        const messageBox = document.createElement('div');
        messageBox.classList.add('message-box');

        const usernameDiv = document.createElement('div');
        usernameDiv.classList.add('message-username');
        usernameDiv.textContent = role === 'user' ? 'User' : 'Assistant';
        messageBox.appendChild(usernameDiv);

        const contentDiv = document.createElement('div');
        contentDiv.classList.add('message-content');
        messageBox.appendChild(contentDiv);

        if (role === 'user' && files.length > 0) {
            const fileList = document.createElement('div');
            fileList.className = 'uploaded-files';
            files.forEach(file => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                const fileSize = (file.size / 1024).toFixed(2); // Conversion to KB
                fileItem.innerHTML = `
                    📁 
                    ${file.name} (${fileSize} KB)
                `;
                fileList.appendChild(fileItem);
            });
            messageBox.appendChild(fileList);
        }

        const timestampDiv = document.createElement('div');
        timestampDiv.classList.add('message-timestamp');
        timestampDiv.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        messageBox.appendChild(timestampDiv);

        contentWrapper.appendChild(messageBox);
        
        const actionsDiv = document.createElement('div');
        actionsDiv.classList.add('message-actions');
        
        contentWrapper.appendChild(actionsDiv);

        messageDiv.appendChild(iconDiv);
        messageDiv.appendChild(contentWrapper);
        chatContainer.appendChild(messageDiv);

        if (role === 'assistant') {
            const loadingIndicator = document.createElement('span');
            loadingIndicator.classList.add('loading-indicator');
            messageBox.insertBefore(loadingIndicator, contentDiv);
        }
    }

    const contentDiv = messageDiv.querySelector('.message-content');
    contentDiv.innerHTML = marked.parse(content);  // Use marked.js to parse Markdown content

    // Highlight code blocks if necessary
    messageDiv.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
        addCopyButtonToCodeBlock(block);
    });

    if (role === 'assistant') {
        const loadingIndicator = messageDiv.querySelector('.loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
        if (isLatestAssistantMessage(messageDiv)) {
            addRegenerateButton(messageDiv);
        }
    }

    addMessageButtons(messageDiv, role === 'user' ? ['fork', 'copy', 'delete'] : ['regenerate', 'fork', 'copy', 'delete']);

    if (isScrolledToBottom()) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    return messageDiv;
}

function isScrolledToBottom() {
    const threshold = 100; // pixels from bottom
    return chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < threshold;
}

function isLatestAssistantMessage(messageDiv) {
    const assistantMessages = chatContainer.querySelectorAll('.message.assistant');
    return assistantMessages[assistantMessages.length - 1] === messageDiv;
}

function addCopyButtonToCodeBlock(block) {
    const button = document.createElement('button');
    button.textContent = 'Copy';
    button.className = 'copy-code-button';
    button.onclick = function() {
        navigator.clipboard.writeText(block.textContent).then(() => {
            button.textContent = 'Copied!';
            setTimeout(() => {
                button.textContent = 'Copy';
            }, 2000);
        });
    };
    block.parentNode.insertBefore(button, block);
}

function copyMessageContent(contentDiv) {
    navigator.clipboard.writeText(contentDiv.textContent).then(() => {
        alert('Message content copied to clipboard!');
    });
}

function deleteMessage(messageDiv) {
    const index = Array.from(chatContainer.children).indexOf(messageDiv);
    if (index > -1) {
        currentConversation.messages.splice(index, 1);
        messageDiv.classList.add('deleting');
        setTimeout(() => {
            chatContainer.removeChild(messageDiv);
        }, 300);
    }
}

function forkChat(messageDiv) {
    const index = Array.from(chatContainer.children).indexOf(messageDiv);
    const newConversation = {
        id: Date.now(),
        title: "Forked Chat",
        messages: currentConversation.messages.slice(0, index + 1),
        model: currentModel,
        hasCustomTitle: false
    };
    conversations.unshift(newConversation);
    currentConversation = newConversation;
    updateConversationList();
    loadConversation(newConversation);
}

function addRegenerateButton(messageDiv) {
    const actionsDiv = messageDiv.querySelector('.message-actions');
    if (!actionsDiv.querySelector('.regenerate-button')) {
        const regenerateButton = document.createElement('button');
        regenerateButton.classList.add('action-button', 'regenerate-button');
        regenerateButton.textContent = 'Regenerate';
        regenerateButton.onclick = () => regenerateResponse(messageDiv);
        actionsDiv.insertBefore(regenerateButton, actionsDiv.firstChild);
    }
}

function regenerateResponse(messageDiv) {
    const index = Array.from(chatContainer.children).indexOf(messageDiv);
    if (index > -1) {
        currentConversation.messages = currentConversation.messages.slice(0, index);
        while (chatContainer.children.length > index) {
            chatContainer.removeChild(chatContainer.lastChild);
        }
        sendMessage();
    }
}

function removeRegenerateButtons() {
    const assistantMessages = document.querySelectorAll('.message.assistant');
    assistantMessages.forEach((message, index) => {
        if (index < assistantMessages.length - 1) {
            const regenerateButton = message.querySelector('.regenerate-button');
            if (regenerateButton) {
                regenerateButton.remove();
            }
        }
    });
}

async function sendMessage() {
    if (isSending) return;
    isSending = true;

    const userMessage = userInput.value.trim();
    if (userMessage === '' && uploadedFiles.length === 0) {
        isSending = false;
        return;
    }

    if (!currentConversation) {
        createNewConversation();
    }

    document.getElementById('loading-indicator').style.display = 'block';
    
    const userMessageDiv = addMessage('user', userMessage, uploadedFiles);
    
    userInput.value = '';
    userInput.disabled = true;

    try {
        const fileContents = await Promise.all(uploadedFiles.map(file => readFile(file)));
        const response = await fetch('/.netlify/functions/generateMessage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userMessage,
                currentConversation,
                uploadedFiles: fileContents.map((content, index) => ({
                    name: uploadedFiles[index].name,
                    content: content
                })),
                model: currentModel,
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.aiResponse;

        const assistantMessageDiv = addMessage('assistant', aiResponse);

        currentConversation.messages.push({ role: 'user', content: userMessage, files: uploadedFiles });
        currentConversation.messages.push({ role: 'assistant', content: aiResponse });
        
        if (currentConversation.messages.length === 2 && !currentConversation.hasCustomTitle) {
            await generateTitle(userMessage, aiResponse);
            currentConversation.hasCustomTitle = true;
        }

        removeRegenerateButtons();
        uploadedFiles = []; // Clear uploaded files after sending
        updateFileList(); // Update the file list display

    } catch (error) {
        console.error('Error in sendMessage:', error);
        addMessage('assistant', `Something went wrong. Error details: ${error.message}`);
    } finally {
        isSending = false;
        document.getElementById('loading-indicator').style.display = 'none';
        userInput.disabled = false;
        userInput.style.height = 'auto';
    }
}

function addMessageButtons(messageDiv, buttons) {
    const actionsDiv = messageDiv.querySelector('.message-actions');
    actionsDiv.innerHTML = '';

    buttons.forEach(button => {
        const buttonElement = document.createElement('button');
        buttonElement.classList.add('action-button', `${button}-button`);
        buttonElement.textContent = button.charAt(0).toUpperCase() + button.slice(1);
        
        switch (button) {
            case 'regenerate':
                buttonElement.onclick = () => regenerateResponse(messageDiv);
                break;
            case 'fork':
                buttonElement.onclick = () => forkChat(messageDiv);
                break;
            case 'copy':
                buttonElement.onclick = () => copyMessageContent(messageDiv.querySelector('.message-content'));
                break;
            case 'delete':
                buttonElement.onclick = () => deleteMessage(messageDiv);
                break;
        }

        actionsDiv.appendChild(buttonElement);
    });
}

async function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target.result;

            // Check if the file is a PDF
            if (file.type === "application/pdf") {
                // Use pdf.js to extract text
                const loadingTask = pdfjsLib.getDocument({ data: content });
                loadingTask.promise.then(pdf => {
                    let textPromises = [];
                    for (let i = 1; i <= pdf.numPages; i++) {
                        textPromises.push(pdf.getPage(i).then(page => {
                            return page.getTextContent().then(textContent => {
                                return textContent.items.map(item => item.str).join(' ');
                            });
                        }));
                    }

                    // Wait for all text extraction promises to resolve
                    Promise.all(textPromises).then(pageTexts => {
                        // Combine all page texts into a single string and resolve
                        resolve(pageTexts.join('\n'));
                    });
                }).catch(error => {
                    reject(error); // Reject on error loading PDF
                });
            } else {
                resolve(content); // Resolve directly for non-PDF files
            }
        };
        reader.onerror = (e) => {
            reject(e);
        };
        reader.readAsArrayBuffer(file); // Read the file as an ArrayBuffer
    });
}


async function generateTitle(userMessage, assistantMessage) {
    const titlePrompt = `Based on this conversation, suggest a brief title (max 6 words):
    User: ${userMessage}
    Assistant: ${assistantMessage}`

    try {
        const response = await fetch('/.netlify/functions/generateTitle', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userMessage, assistantMessage })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to generate title: ${errorData.error.message}`);
        }

        const data = await response.json();
        currentConversation.title = data.choices[0].message.content.replace(/"/g, '').trim();
        currentConversation.hasCustomTitle = true;
        updateConversationList();
        updateConversationTitle();
    } catch (error) {
        console.error('Error generating title:', error);
    }
}

function updateConversationTitle() {
    if (currentConversation) {
        const newTitle = currentConversation.title;
        conversationTitle.textContent = newTitle;
        
        // Center the conversation title
        const mainWidth = main.offsetWidth;
        const sidebarWidth = isSidebarVisible ? 260 : 0;
        conversationTitle.style.transform = `translateX(-50%) translateX(${sidebarWidth / 2}px)`;
    } else {
        conversationTitle.textContent = "New Conversation";
    }
}

async function uploadFile(file) {
    fileProgress.style.width = '0%';
    fileProgress.style.display = 'block';
    
    for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 50));
        fileProgress.style.width = `${i}%`;
    }
    
    uploadedFiles.push(file);
    
    setTimeout(() => {
        fileProgress.style.display = 'none';
        updateFileList(); // Call updateFileList here
    }, 500);
}

function updateFileList() {
    fileList.innerHTML = '';
    uploadedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.classList.add('file-item');
        const fileSize = (file.size / 1024).toFixed(2);
        fileItem.innerHTML = `
            📁 
            <span>${file.name} (${fileSize} KB)</span>
            <button class="delete-file">×</button>
        `;
        fileItem.querySelector('.delete-file').onclick = () => removeFile(index);
        fileList.appendChild(fileItem);
    });
}


function removeFile(index) {
    const fileItem = fileList.children[index];
    fileItem.classList.add('deleting');
    setTimeout(() => {
        uploadedFiles.splice(index, 1);
        updateFileList();
    }, 300);
}

function toggleSidebar() {
    isSidebarVisible = !isSidebarVisible;
    sidebar.classList.toggle('hidden');
    main.classList.toggle('sidebar-hidden');
    toggleSidebarBtn.textContent = isSidebarVisible ? '<' : '>';
    adjustLayout();
}

function adjustLayout() {
    const inputAreaHeight = document.getElementById('input-area').offsetHeight;
    copyright.style.bottom = `${inputAreaHeight}px`;

    if (isSidebarVisible) {
        copyright.style.left = '260px';
    } else {
        copyright.style.left = '0';
    }

    updateConversationTitle();
}

function stopGenerating() {
    if (abortController) {
        abortController.abort();
        abortController = null;
    }
}

// Event listeners
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 150) + 'px';
});

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

newChatBtn.addEventListener('click', createNewConversation);

themeToggle.addEventListener('change', function() {
    document.body.classList.toggle('light-mode');
});

fileUploadButton.addEventListener('click', () => fileUploadInput.click());

fileUploadInput.addEventListener('change', async (event) => {
    const files = event.target.files;
    for (let i = 0; i < files.length; i++) {
        if (uploadedFiles.length >= 5) {
            alert('You can only upload up to 5 files.');
            break;
        }
        const file = files[i];
        if (file.size > 30 * 1024 * 1024) {
            alert(`File ${file.name} is too large. Maximum size is 30MB.`);
            continue;
        }
        await uploadFile(file);
    }
    fileUploadInput.value = '';
    updateFileList(); // Call updateFileList here as well
});

sendMessageButton.addEventListener('click', sendMessage);

modelSelect.addEventListener('click', (e) => {
    e.stopPropagation();
    modelDropdown.classList.toggle('show');
});

document.addEventListener('click', (e) => {
    if (!modelSelect.contains(e.target)) {
        modelDropdown.classList.remove('show');
    }
});

document.querySelectorAll('.model-option').forEach(option => {
    option.addEventListener('click', (e) => {
        e.stopPropagation();
        currentModel = e.currentTarget.dataset.model;
        modelSelect.querySelector('.model-select-button').textContent = e.currentTarget.querySelector('.model-name').textContent;
        modelDropdown.classList.remove('show');
    });
});

toggleSidebarBtn.addEventListener('click', toggleSidebar);

document.addEventListener('mousemove', (e) => {
    if (e.clientX <= 10) {
        toggleSidebarBtn.style.opacity = '1';
    } else {
        toggleSidebarBtn.style.opacity = '0';
    }
});

window.addEventListener('resize', adjustLayout);
new ResizeObserver(adjustLayout).observe(document.getElementById('input-area'));

chatContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('loading-indicator')) {
        stopGenerating();
    }
});

// Initialize the chat
if (conversations.length === 0) {
    createNewConversation();
} else {
    currentConversation = conversations[0];
    loadConversation(currentConversation);
}
adjustLayout();