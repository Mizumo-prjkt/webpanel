// Setup JS for setup.html

// This script handles the setup process for WebPanel, including checking prerequisites and displaying success or error messages.
// and also behavioral parts of the User interface

// Show the popup on page load
document.addEventListener('DOMContentLoaded', (event) => {
    const popup = document.getElementById('setup-popup');
    popup.hidden = false;
    popup.classList.add('is-flex', 'is-justify-content-center', 'is-align-items-center');

    const c1 = document.getElementById('c1');
    let page = 1;
    const c2 = document.getElementById('c2');
    const c3 = document.getElementById('c3');
    const c4 = document.getElementById('c4');
    const c5 = document.getElementById('c5');

    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    nextBtn.addEventListener('click', () => {
        if (page === 1) {
            c1.hidden = true;
            c2.hidden = false;
            prevBtn.disabled = false;
            page = 2;
        } else if (page === 2) {
            c2.hidden = true;
            c3.hidden = false;
            // Call our new function from distrocheck.js
            if (typeof checkDistro === 'function') {
                checkDistro();
            }
            page = 3;
        } else if (page === 3) {
            c3.hidden = true;
            c4.hidden = false;
            if (typeof initAccountCreation === 'function') {
                initAccountCreation();
            }
            page = 4;
        } else if (page === 4) {
            page = 5;
            //prevBtn.disabled = true; // Prevent user from going back to the signup page and triggering the first-time-signup
            c4.hidden = true;
            c5.hidden = false;
        } else if (page === 5) {
            c5.hidden = true;
            c6.hidden = false;
            page = 6;
        }

    });
    
    prevBtn.addEventListener('click', function() {
        if (page === 2) {
            c1.hidden = false;
            c2.hidden = true;
            prevBtn.disabled = true;
            nextBtn.disabled = false;
            page = 1;
        } else if (page === 3) {
            c2.hidden = false;
            c3.hidden = true;
            page = 2;
        } else if (page === 4) {
            c3.hidden = false;
            c4.hidden = true;
            page = 3;
        } else if (page === 5) {
            showExternNotification('is-warning', `<strong>NOPE!</strong> You have already created your account, and you can no longer go back. \nIf you want changes to your new account, please visit the settings later...`)
        }
    });

    // Test popup
    const testButton = document.getElementById('test-floating-card-popup');
    const divcardpopuptest = document.getElementById('card-pop-bg');
    function testPopup() {
        Object.assign(divcardpopuptest.style, {
            display: 'flex',
        });
        divcardpopuptest.hidden = !divcardpopuptest.hidden;
    }
    testButton.addEventListener('click', testPopup);
    if (divcardpopuptest) {
        divcardpopuptest.querySelector('.delete').addEventListener('click', function() {
            divcardpopuptest.hidden = true;
            Object.assign(divcardpopuptest.style, {
                display: 'none',
            });
        });
    }
    
});


function showExternNotification(type, message) {
    const exnotificationDiv = document.getElementById('external-notif');
    if (exnotificationDiv) {
        exnotificationDiv.innerHTML = `
            <div class="notification ${type} is-light">
                <button class="delete"></button>
                ${message}
            </div>
        `;
    }
    // Trigger for delete notif
    exnotificationDiv.querySelector('.delete').addEventListener('click', (e) => {
        e.target.parentElement.remove();  
    })
}