//--------------------------------- index.js -----------------------------------
// This file contains the methods that handle the behavior of the main
// application page (MediaTrends.html).
// It makes AJAX fetch calls to the API to satisfy different user interactions
// with the MediaTrends application
// -----------------------------------------------------------------------------
"use strict";
(function () {
    const BASE_URL = "/mediaTrends/";
    window.addEventListener("load", init);

    let username;

    /**
     * Sets up page on load.
     */
    async function init() {
        // console.log(sessionStorage.getItem('username'));
        // if(sessionStorage.getItem('username')) {
        //     username = sessionStorage.getItem('username');
        // } else {
        //     username = '';
        // }
        // loadUserData();
        username = sessionStorage.getItem('username');
        await loadDB();
        username = sessionStorage.getItem('username');
        console.log(username);
        id("sign-in-out-button").classList.remove("hidden");
        if ((username === null) || (username === '')) {
            id("sign-in-out-button").textContent = "Sign In";
            id("update-button").classList.add("hidden");
            id("recommend-movies-by-favorite").classList.add("hidden");
        } else {
            id("sign-in-out-button").textContent = "Sign Out";
            id("update-button").classList.remove("hidden");
            id("recommend-movies-by-favorite").classList.remove("hidden");
        }
        id("sign-in-out-button").addEventListener("click", login);
        id("update-button").addEventListener("click", function() {
            window.location.href = 'updateuserinfo.html';
        });
    }

    function updateInfo() {
        window.location.href = 'updateuserinfo.html';
    }

    function login() {
        sessionStorage.setItem('username', '');
        window.location.href = 'login.html';
    }

    async function loadDB() {
        fetch(BASE_URL + "makeNewDB")
            .then(statusCheck)
            .then(res => res.text())
            .then(async (response) => {
                if(response) {
                    console.log(response);
                    //todo if any
                }
             })
            .catch(console.log);
    }

    /**
    * Helper function to return the response's result text if successful, otherwise
    * returns the rejected Promise result with an error status and corresponding text
    * @param {object} res - response to check for success/error
    * @return {object} - valid response if response was successful, otherwise rejected
    *                    Promise result
    */
    async function statusCheck(res) {
        if (!res.ok) {
            throw new Error(await res.text());
        }
        return res;
    }

    /**
     * Returns the element that has the ID attribute with the specified value.
     * @param {string} name - element ID.
     * @returns {object} DOM object associated with ID.
     */
    function id(name) {
        return document.getElementById(name);
    }



    /**
     * Returns first element matching selector.
     * @param {string} selector - CSS query selector.
     * @returns {object} - DOM object associated selector.
     */
    function qs(selector) {
        return document.querySelector(selector);
    }

    /**
     * Returns all element matching the selector.
     * @param {string} selector - CSS query selector.
     * @returns {array} - an array of DOM objects associated selector.
     */
    function qsa(selector) {
        return document.querySelectorAll(selector);
    }

    /**
     * creates and returns a new empty DOM node representing an element of that tagName type
     * @param {string} tagName - HTML element type.
     * @returns {object} - A new DOM object representing an element of that tagName type
     */
    function gen(tagName) {
        return document.createElement(tagName);
    }
})();