<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
type Chat = {
    content: string,
    role: string,
    ticId: string
}
const isOpen = ref(false)
let chat = ref<Chat[]>([]);
// {ticId: {content: ["", ...], timeModified: Date }}
let intervalId: number | null = null;
const chatContainer = ref<HTMLElement | null>(null);
const chatListContainer = ref<HTMLElement | null>(null);
const isVisible = ref(true)

function handleKeyPress(event: KeyboardEvent) {
  if (event.shiftKey && event.key === 'Q') {
    isVisible.value = !isVisible.value
  }
}
const screenshotUrl = ref('')

function takeScreenshot() {
    console.log("takeScreenshot")
  chrome.runtime.sendMessage({action: "takeScreenshot"}, (response) => {
    if (response.error) {
      console.error("Error taking screenshot:", response.error);
    } else if (response && response.screenshotUrl) {
      screenshotUrl.value = response.screenshotUrl;
      console.log(screenshotUrl.value, "screenshotUrl")
      // You can now use this URL to display the screenshot or send it to your backend
    } else {
      console.error("Unexpected response:", response);
    }
  });
}
// Function to check if the current page is Google Meet
function isGoogleMeet() {
    console.log("true")
    return window.location.hostname === 'meet.google.com';
}
const assistantButton = ref<HTMLElement | null>(null);
// Function to create a random id of length 10
function randomId() {
    return Math.random().toString(36).substring(2, 12);
}
let tempChat: any = {};
// The main interval function
function runInterval() {
    try {
        activateCaptionsforGoogleMeet()
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
        let speakerContainers = ccContainer.querySelectorAll(".TBMuR.bj4p3b");
        speakerContainers.forEach((speaker) => {
            const ticIdOnDiv = speaker.getAttribute("ticId");
            const ticId = ticIdOnDiv || randomId();
            const nameElement = speaker.querySelector(".jxFHg");
            const name = nameElement ? nameElement.textContent : '';
            const content = speaker.querySelector(".iTTPOb.VbkSUe");

            if (!tempChat[ticId]) {
                tempChat[ticId] = { content: [], timeModified: Date.now() };
            }

            if (content) {
                const spans = content.querySelectorAll('span');
                spans.forEach((span, index) => {
                    if (!span.hasAttribute("ticAdded")) {
                        tempChat[ticId].content.push(span.textContent);
                        span.setAttribute("ticAdded", "true");
                    } else if (index === spans.length - 1) {
                        tempChat[ticId].content[tempChat[ticId].content.length - 1] = span.textContent || '';
                    }
                    tempChat[ticId].timeModified = Date.now();
                    
                });
            }
           
            const chatInstance = { role: name, content: tempChat[ticId].content.join(" "), ticId };
            // const chatInstance = { role: name, content: content.trim(), ticId };
            console.log(chatInstance, "chatInstance")
            if (ticIdOnDiv) {
             
                    const chatIndex = chat.value.findIndex(
                        (chatInstance) => chatInstance.ticId === ticId
                    );
                   
                        chat.value[chatIndex].content = chatInstance.content;
                        chat.value[chatIndex].role = chatInstance.role ?? '';
                        chat.value[chatIndex].ticId = chatInstance.ticId;
                     
                        console.log("Chat instance not found, adding new one");
                
                    
                } else {
                    console.log("Chat array is empty, initializing with new instance");
                    chat.value.push({
                        content: chatInstance.content,
                        role: chatInstance.role ?? '',
                        ticId: chatInstance.ticId
                    });
                    speaker.setAttribute("ticId", ticId);
                }
                // console.log(chat.value, "chat")
            
           


            // cleanup tempChat if any ticId has not been modified in the last 10 seconds
            Object.keys(tempChat).forEach((ticId) => {
                if (Date.now() - tempChat[ticId].timeModified > 10000) {
                    delete tempChat[ticId];
                }
            });
            // send chat to service worker
            // const meetId = window.location.href.split("?")[0].split("/").pop();
            // chrome.runtime.sendMessage({
            //     type: "CURRENT_CHAT",
            //     data: { chat, meetId },
            // });
        })
    }catch(e){
        console.log("no CC", e);
    }
}


function scrollToBottom() {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
    if (chatListContainer.value) {
        chatListContainer.value.scrollTop = chatListContainer.value.scrollHeight;
    }
  });
}

async function sendMessage() {
  // Get the last 5 messages
  const lastFiveMessages = chat.value.slice(-5);

  // Call backend service
  try {
    const response = await fetch('YOUR_BACKEND_URL', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages: lastFiveMessages }),
    });
    const data = await response.json();
    
    // Add response to chat
    chat.value.push({
      content: data.response,
      role: 'Assistant',
      ticId: randomId()
    });
  } catch (error) {
    console.error('Error calling backend:', error);
  }
}

function resetChat() {
  chat.value = [];
}

function activateCaptionsforGoogleMeet(){
 const captionDivs = document.querySelectorAll("div.juFBl");
 console.log(captionDivs,"caption");
 if (captionDivs.length > 0) {
   // get the button inside the first div
   const button = captionDivs[0].querySelector("button");
   console.log(button,"button");
   if (button) {
     // click the button
     //if buttion aria-label is "Turn on Captions"
     if(button.ariaLabel === "Turn on captions"){
        button.click();
     }
    
   }
 }
}
// Watch for changes in the chat array
watch(() => chat.value, () => {
  scrollToBottom();
}, { deep: true });

const chatbox = ref<HTMLElement | null>(null);


onMounted(() => {
  if (isGoogleMeet()) {
    intervalId = window.setInterval(runInterval, 500);
  }
  window.addEventListener('keydown', handleKeyPress)
});

onUnmounted(() => {
  if (intervalId !== null) {
    clearInterval(intervalId);
  }
  window.removeEventListener('keydown', handleKeyPress)
});
</script>

<template>
    <div  v-show="isVisible"  v-if="!isOpen" ref="assistantButton" class="assistant-button" @click="isOpen = true">
        Assistant
    </div>
    <Teleport to="body">
        <div  v-show="isVisible"  v-if="isOpen" class="openPanel" ref="chatbox">
            <div class="panel-header">
                <h2>Interview Assistant</h2>
                <div @click="isOpen = false" class="chat-close">
                    <button class="close-button">
                    &times;
                </button>
                </div>
               
            </div>
            <div ref="chatContainer" class="chat-container">
                
                <div ref="chatListContainer" :class="screenshotUrl ? 'chat-list-container' : 'chat-list-container-without-screenshot'">
                    <p style="margin-top: -30px; margin-bottom: 10px;">
                    <strong><i style="color: red;">Note:</i></strong>
                    <i style="color: green; margin-left: 4px;">Please turn on captions to use this feature</i>
                </p>
                    <ul class="chat-list">
                        <li v-for="message in chat" :key="message.ticId" class="chat-message">
                            <strong class="message-role">{{ message.role }}:</strong>
                            <span class="message-content">{{ message.content }}</span>
                        </li>
                    </ul>
                </div>
                <div v-if="screenshotUrl" class="screenshot-container">
                    <img :src="screenshotUrl" alt="Screenshot" style="width: 100%; height: 100%;" />
                    <div class="close-button-container" v-if="screenshotUrl" @click="screenshotUrl = ''">
                        &times;
                    </div>
                </div>
                <div class="button-container">
                    
                <button @click="takeScreenshot" style="font-size: 10px;color:black;border: 1px solid black;border-radius: 99999px;padding: 8px;background-color: white;">Take Screenshot</button>
                <div class="button-container-2">
                    <button @click="sendMessage" class="send-button">Send</button>
                    <button @click="resetChat" class="reset-button">Reset</button>
                </div>
            </div>
            </div>
            
        </div>
    </Teleport>
</template>

<style scoped>
.body{
    display: flex !important;
    width: 100%;
    position: relative;
}
.assistant-button {
    position: fixed;
    bottom: 50px;
    right: -20px;
    padding: 10px 20px;
    background-color: #4285f4;
    color: white;
    border-radius: 5px;
    cursor: move;
    z-index: 9999;
    transform: rotate(90deg);
    user-select: none;
}

.openPanel {
    position: fixed;
    bottom: 0px;
    right: 10px;
    width: 400px;
    height: 99%;
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

.close-button-container{
    cursor: pointer;
    height: 20px;
    width: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.chat-container {
    flex-grow: 1;
    padding: 20px;
    height: 100%;
    overflow: hidden;
    margin-bottom: 10px; /* Make room for the button container */
}

.chat-list-container{
    padding-top: 25px;
    display: flex;
    flex-grow: 1;
    height: calc(100% - 160px);
    scroll-behavior: smooth;
    overflow-y: auto;
}
.chat-list-container-without-screenshot{
    padding-top: 25px;
    display: flex;
    flex-grow: 1;
    height: 90%;
    scroll-behavior: smooth;
    overflow-y: auto;
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

.button-container {
    padding: 10px;
    display: flex;
    border-top: 1px solid #ddd;
    background-color: #f0f0f0;
    justify-content: space-between;
    align-items: center;
    height: 60px;

}

.button-container-2{
    display: flex;
    align-items: center;
    gap: 8px;
}

.send-button, .reset-button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.send-button {
    background-color: #4285f4;
    color: white;
}

.reset-button {
    background-color: #f44336;
    color: white;
}
.screenshot-container{
    display: flex;
    align-items: center;
    height: 100px;
    width: 100%;
    position: relative;
}
.close-button-container{
    position: absolute;
    top: -10px;
    right: 0px;
    color: black;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgb(241, 15, 49);
    border-radius: 100%;
    width: 24px;
    height: 24px;
}
.chat-close{

    cursor: pointer;
    height: 20px;
    width: 20px;
    display: flex;
    justify-content: center;
    align-items: center;

}
</style>

