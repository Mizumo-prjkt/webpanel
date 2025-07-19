// Distro Check for setup.html
// Checking the Linux Distro the server is running

function checkDistro() {
    const c3 = document.getElementById('c3');
    const nextBtn = document.getElementById('next-btn');

    // Set initial state and disable next button during check
    c3.innerHTML = `
        <h2>Checking Server's Distro</h2>
        <p>Checking...</p>
    `;
    nextBtn.disabled = true;

    fetch('/api/check-linux-distribution', {
        method: 'POST'
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.message || 'Failed to get distribution info.');
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'success') {
            c3.innerHTML = `
                <h2>Checking Server's Distro</h2>
                <div class="notification is-success is-light">
                    <p><strong>Distribution Detected:</strong> ${data.prettyName}</p>
                    <p><strong>ID:</strong> ${data.distro}</p>
                    <p><strong>Version:</strong> ${data.distroVersion}</p>
                </div>
                <p>Your system seems compatible. You can proceed to the next step.</p>
            `;
            nextBtn.disabled = false;
        } else {
             throw new Error(data.message || 'Unknown error during distro check.');
        }
    })
    .catch(error => {
        console.error('Distro Check Error:', error);
        c3.innerHTML = `
            <h2>Checking Server's Distro</h2>
            <div class="notification is-danger is-light">
                <p><strong>Error checking distribution:</strong> ${error.message}</p>
            </div>
            <p>Cannot proceed. Please check server logs for more information.</p>
        `;
        // The 'next' button will remain disabled on error
    });
}
