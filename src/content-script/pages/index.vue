<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

type Chat = {
    content: string,
    role: string,
    ticId: string
}
const isOpen = ref(false)
const chats = ref([])
let chat = ref<Chat[]>([]);
// {ticId: {content: ["", ...], timeModified: Date }}
let intervalId: number | null = null;

// Function to check if the current page is Google Meet
function isGoogleMeet() {
    console.log("true")
    return window.location.hostname === 'meet.google.com';
}

// Function to create a random id of length 10
function randomId() {
    return Math.random().toString(36).substring(2, 12);
}

// The main interval function
function runInterval() {
    try {
        let tempChat: any = {};
        console.log("true")
        const chatDivs = document.querySelectorAll("div.iOzk7");
        //     console.log(chatDivs,"chatDivs")
        const ccContainer = Array.from(chatDivs).find((div) => {
            return (div as HTMLElement).style.display !== "none";
        });
        if (!ccContainer) {
            console.error("No visible chat container found");
            return;
        }
        //     console.log(ccContainer,"ccChat")
        let speakerContainers = ccContainer.querySelectorAll(".TBMuR.bj4p3b");
        // Note: randomId function is already defined above
        console.log(speakerContainers, "speakerContainers")
        speakerContainers.forEach((speaker) => {
            const ticIdOnDiv = speaker.getAttribute("ticId");
            console.log(ticIdOnDiv, "ticIdOnDiv")
            const ticId = ticIdOnDiv || randomId();
            const nameElement = speaker.querySelector(".jxFHg");
            const name = nameElement ? nameElement.textContent : '';
            const content = speaker.querySelector(".iTTPOb.VbkSUe");

            if (!tempChat[ticId]) {
                tempChat[ticId] = { content: [], timeModified: Date.now() };
            }
            if (content) {
                for (let i = 0; i < content.children.length; i++) {
                    const span = content.children[i];
                    if (!span.getAttribute("ticAdded")) {
                        // console.log("false")
                        tempChat[ticId].content.push(span.textContent || '');
                        span.setAttribute("ticAdded", "true");
                        tempChat[ticId].timeModified = Date.now();
                    } else if (i === content.children.length - 1) {
                        tempChat[ticId].content[tempChat[ticId].content.length - 1] =
                            span.textContent;
                        tempChat[ticId].timeModified = Date.now();
                    }
                }
                console.log(tempChat[ticId].content, "tempChat")
                const chatInstance = { role: name, content: tempChat[ticId].content.join(" "), ticId };
                // const chatInstance = { role: name, content: content.trim(), ticId };
                console.log(chatInstance.content, "chatInstance")
                if (ticIdOnDiv) {
                    if (chat.value.length > 0) {
                        const chatIndex = chat.value.findIndex(
                            (chatInstance) => chatInstance.ticId === ticId
                        );
                        chat.value[chatIndex].content = chatInstance.content;
                        chat.value[chatIndex].role = chatInstance.role ?? '';
                        chat.value[chatIndex].ticId = chatInstance.ticId;
                    }
                    else {
                        console.log("inside")
                        if (chat.value[0]) {
                            chat.value[0].content = chatInstance.content;
                            chat.value[0].role = chatInstance.role ?? '';
                            chat.value[0].ticId = chatInstance.ticId;
                        } else {
                            chat.value.push({
                                content: chatInstance.content,
                                role: chatInstance.role ?? '',
                                ticId: chatInstance.ticId
                            });
                        }

                        console.log(chat.value, "chat")
                    }
                    speaker.setAttribute("ticId", ticId);
                }
            }
        })
    } catch (e) {
            console.log("no CC", e);
        }
        }


onMounted(() => {
            // intervalId = setInterval(runInterval, 1000) as unknown as number;
        });

        onUnmounted(() => {
            if (intervalId !== null) {
                clearInterval(intervalId);
            }
        });
</script>

<template>
    <div v-if="!isOpen" class="assistant-button" @click="isOpen = true">
        Assistant
    </div>
    <div v-if="isOpen" class="openPanel">
        <div class="panel-header">
            <h2>Chat Assistant</h2>
            <button @click="isOpen = false" class="close-button">
                &times;
            </button>
        </div>
        <div class="chat-container">
            <ul class="chat-list">
                <li v-for="message in chat" :key="message.ticId" class="chat-message">
                    <strong class="message-role">{{ message.role }}:</strong>
                    <span class="message-content">{{ message.content }}</span>
                </li>
            </ul>
        </div>
    </div>
</template>

<style scoped>
.assistant-button {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 10px 20px;
    background-color: #4285f4;
    color: white;
    border-radius: 5px;
    cursor: pointer;
    z-index: 9999;
}

.openPanel {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 400px;
    height: 600px;
    background-color: #f0f0f0;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    z-index: 9999;
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 20px;
    background-color: #4285f4;
    color: white;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
}

.close-button {
    background: none;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
}

.chat-container {
    flex-grow: 1;
    overflow-y: auto;
    padding: 20px;
}

.chat-list {
    list-style-type: none;
    padding: 0;
    margin: 0;
}

.chat-message {
    margin-bottom: 10px;
    padding: 10px;
    background-color: white;
    border-radius: 5px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.message-role {
    color: #4285f4;
}

.message-content {
    margin-left: 5px;
}
</style>
