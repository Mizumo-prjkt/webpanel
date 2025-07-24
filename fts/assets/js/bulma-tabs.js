// Bulma tabs for setup.html

// This js script just handles the tab switching in the setup.html file

document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tabs li');
    const tabContents = document.querySelectorAll('.tab-content-class .content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove 'is-active' class from all tabs
            tabs.forEach(t => t.classList.remove('is-active'));
            // Add 'is-active' class to the clicked tab
            tab.classList.add('is-active');

            // Hide all tab contents
            tabContents.forEach(content => content.style.display = 'none');
            // Show the content of the clicked tab
            const activeContent = document.querySelector(`.tab-content-class .content[data-content="${tab.dataset.tab}"]`);
            if (activeContent) {
                activeContent.style.display = 'block';
            }
        });
    });

    // Initialize the first tab as active
    if (tabs.length > 0) {
        tabs[0].click();
    }
});