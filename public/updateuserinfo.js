//--------------------------------- updateuserinfo.js -----------------------------------
// This file contains the methods that handle the behavior of the uodate user info
// page.
// It makes AJAX fetch calls to the API to validate user credentials or create
// new users in the database
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
        if (sessionStorage.getItem('username') === '' || sessionStorage.getItem('username') === null) {
            id("error-page").classList.remove("hidden");
            id("update-page").classList.add("hidden");
        } else {
            id("error-page").classList.add("hidden");
            id("update-page").classList.remove("hidden");
            username = sessionStorage.getItem('username');
            id("back-button").addEventListener("click", function() {
                window.history.back();
            });
            id("updateinfo-form").addEventListener("submit", function (e) {
                // Fires when submit event happens on form
                // If we've gotten in here, all HTML5 validation checks have passed
                e.preventDefault(); // prevent default behavior of submit (page refresh)
                //submitRequest(); // intended response function
            });
        }
    }

    function submitRequest() {
            let pwd = id("password").value;
            let cpwd = id("cpassword").value;

            if (pwd !== cpwd) {
                clearForm();
                id("error-msg").textContent = "Passwords do not match. Please try again.";
                id("error-msg").classList.remove("hidden");
                return;
            }
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
})();