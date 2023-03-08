//--------------------------------- index.js -----------------------------------
// This file contains the methods that handle the behavior of the main
// application page (MediaTrends.html).
// It makes AJAX fetch calls to the API to satisfy different user interactions
// with the MediaTrends application
// -----------------------------------------------------------------------------
"use strict";
(function () {
    const URL = "/verifyCredentials";
    window.addEventListener("load", init);

    let username;

    /**
     * Sets up page on load.
     */
    function init() {
        console.log(sessionStorage.getItem('username'));
        if(sessionStorage.getItem('username')) {
            username = sessionStorage.getItem('username');
        } else {
            username = '';
        }
        loadUserData();
    }

    function loadUserData() {
        let heading = gen("h1");
        heading.textContent = "welcome, " + username;
        id("root").appendChild(heading);
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