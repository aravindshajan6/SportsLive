// script.js

export const scrollToBottom = () => {
    console.log("fn scrollToBottom exec");
    const commentaryBox = document.querySelector('.commentary-box');
    // Set the scroll position to the maximum value
    commentaryBox.scrollTop = commentaryBox.scrollHeight;

}
