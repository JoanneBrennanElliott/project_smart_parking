let eventSource = null;


function updateStatus(message, type = "success") {
    const box = document.getElementById("statusBox");
    box.textContent = message;
   // box.className = ""; // reset classes
   // Reset classes
    box.classList.remove("success", "error");
	box.classList.add(type);
}

document.getElementById("loginBtn").addEventListener("click", async () => {

	
   const username = document.getElementById("loginName").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
	
	document.getElementById("findCarBtn").disabled = false;

	
	const loginStatus = document.getElementById("loginStatus");

	 try {
        const response = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

		const text = await response.text();

		let result;
		try {
			result = JSON.parse(text);
		} catch (jsonErr) {
			console.error("JSON parse error:", jsonErr);
			loginStatus.textContent = "Server returned invalid - please run from localhost:3000";
			loginStatus.className = "error";
			return;
		}
	
		if (result.success) {
			const username = result.userId;  
			 if (result.returning) {
				//loginStatus.textContent = `Welcome back, ${username}!`;	
				//loginStatus.textContent = `Welcome back, ${username}! Last login: ${result.lastLogin}`;
				const pretty = formatLastLogin(result.lastLogin);

				loginStatus.textContent = `Welcome back, ${result.userId}! Last login: ${pretty}`;

				loginStatus.className = "success";
			 } else {
				loginStatus.textContent = `Welcome, ${username}!`;
				loginStatus.className = "success";
			 }
			 
			const panel = document.getElementById("loginPanel");
			
			// Enable reg box
			const carReg = document.getElementById("carReg");
			carReg.disabled = false;

				// Optional: auto-focus it
			carReg.focus();
			panel.classList.add("fadeOut");
			
			document.getElementById("loggedInUserDisplay").textContent =
			`Logged in as: ${username}`;

			
			document.getElementById("bookBtn").disabled = false;
			document.getElementById("bookDisabledBtn").disabled = false;
			
			document.getElementById("logoutBtn").style.display = "block";

			// Remove panel after fade completes
			setTimeout(() => {panel.style.display = "none";}, 600); 
		
		} 
		else {
			if (result.message === "User not found") {
//				loginStatus.textContent = "User not found — would you like to register?";
				 loginStatus.textContent = "User not found — check your spelling or register below";
				 loginStatus.className = "error";

				const registerBtn = document.getElementById("registerBtn");
				const loginBtn = document.getElementById("loginBtn");

				document.getElementById("findCarBtn").disabled = true;
				
				// Show + enable register button
				registerBtn.style.display = "block";
				registerBtn.disabled = false;

				loginBtn.disabled = false;
				//loginBtn.classList.add("no-hover");

				//registerBtn.focus();
				

				registerBtn.style.display = "block";
				//registerBtn.focus();

			} else {

				loginStatus.textContent = "Login Unsuccessful";
				loginStatus.className = "error";
			}
		}
		
	 } catch (err) {
        loginStatus.textContent = "Server Error";
        loginStatus.className = "error";
		  
		console.error("LOGIN ERROR:", err);
		}
				
});


document.addEventListener("DOMContentLoaded", () => {
document.getElementById("registerBtn").addEventListener("click", () => {
    

    const username = document.getElementById("loginName").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
 
    fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    })
    .then(res => res.json())
    .then(result => {
    	
        if (result.success) {

		    const statusBox = document.getElementById("statusBox");
			const loginStatus = document.getElementById("loginStatus");
	
		    document.getElementById("loginStatus").textContent = "";
			document.getElementById("loginStatus").className = "";
			
			loginStatus.textContent = "";
			loginStatus.className = "";
            loginStatus.className = "success";
            loginStatus.textContent = "Registration successful — you can now log in";
            loginStatus.className = "success";
			
			document.getElementById("findCarResult").textContent = "";
			document.getElementById("findCarResult").className = "";		

			const loginBtn = document.getElementById("loginBtn");
			const registerBtn = document.getElementById("registerBtn");

			// Re-enable login button
			loginBtn.disabled = false;
			  
			// Restore hover effect
			loginBtn.classList.remove("no-hover");

			// Hide register button again
			registerBtn.style.display = "none";
			registerBtn.disabled = true;
			// Focus login button
			loginBtn.focus();
        } 
		if (!result.success) {

			loginStatus.textContent = result.message;
			loginStatus.className = "error";
			
			document.getElementById("findCarBtn").disabled = true;
			
			if (result.message === "Username already exists") {
				const loginName = document.getElementById("loginName");
				loginName.focus();
				loginName.select();
			}
			return;
		}
    });

});
});

document.getElementById("logoutBtn").addEventListener("click", () => {

    fetch("/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
    })
    .then(res => res.json())
    .then(result => {
        console.log("Logout response:", result);

        // Even if backend says "not logged in", still reset UI
        // because user clicked logout intentionally
        const popup = document.getElementById("logoutPopup");
        popup.classList.add("show");

        // Hide popup after 2 seconds
        setTimeout(() => { popup.classList.remove("show"); }, 2000);

        const panel = document.getElementById("loginPanel");

        // Reset login fields
        document.getElementById("loginName").value = "admin";
        document.getElementById("loginPassword").value = "1234";
        document.getElementById("loginStatus").textContent = "Please enter your login details";
        document.getElementById("loginStatus").className = "";

        // Clear user display
        document.getElementById("loggedInUserDisplay").textContent = "";

        // Clear Find My Car
        document.getElementById("findCarResult").textContent = "";
        document.getElementById("findCarResult").className = "";
        document.getElementById("findCarBtn").disabled = true;

        // Disable booking buttons
        document.getElementById("bookBtn").disabled = true;
        document.getElementById("bookDisabledBtn").disabled = true;

        // Disable navigation
        document.getElementById("navigateToCarBtn").disabled = true;
        window.lastCarZone = "";
        window.lastCarSpace = "";

        // Hide logout button
        document.getElementById("logoutBtn").style.display = "none";

        // Disable register button
        registerBtn.disabled = true;

        // Clear car reg
        document.getElementById("carReg").value = "";

        // Clear status box
        const statusBox = document.getElementById("statusBox");
        statusBox.textContent = "";
        statusBox.className = "";

        // Bring login panel back
        panel.style.display = "block";
        panel.classList.remove("fadeOut");
        panel.style.opacity = "1";
    })
    .catch(err => console.error("Logout error:", err));
});

//Standard Parking Space
document.getElementById("bookBtn").addEventListener("click", () => {
	
	const carReg = document.getElementById("carReg").value.trim();
		
    fetch("http://localhost:3000/bookSpace", 
	{ 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carReg })
		})
		
        .then(res => res.json())
        .then(data => {
			const type = data.success ? "success" : "error";
			updateStatus(
                `Standard Space: ${data.message}
				\nUser: ${data.userId}
			    \nCar Reg: ${data.carReg}
				\nSpace: ${data.spaceId}
				\nRef: ${data.bookingRef}
				\n Time: ${data.timestampExpiry}`,type);
        })      
        .catch(err => {
            updateStatus("Error booking standard space", "error");
            console.error(err);
        });
});

//Disabled Parking Space
document.getElementById("bookDisabledBtn").addEventListener("click", () => {
    
	 const carReg = document.getElementById("carReg").value.trim();
	 
	 fetch("http://localhost:3000/bookDisabledSpace", 
	{ 
	 method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carReg })
	})
        .then(res => res.json())
        .then(data => {
		const type = data.success ? "success" : "error";
//		updateStatus("Disabled Space: " + data.message, "success");
			updateStatus(
                `Disabled Space: ${data.message}
				\n User: ${data.userId}
				\nCar Reg: ${data.carReg}
				\n Space: ${data.spaceId} 
				\nRef: ${data.bookingRef}
				\n Time: ${data.timestampExpiry}`, type);
        })      
        .catch(err => {
            updateStatus("Error booking disabled space", "error");
            console.error(err);
        });
});


document.getElementById("startBtn").addEventListener("click", () => {
    const entryTimestamp = new Date().toISOString();

    // Connect to Node.js bridge (Server-Sent Events)
    //eventSource = new EventSource(`/streamTimer?entryTimestamp=${entryTimestamp}`);
	eventSource = new EventSource(`http://localhost:3000/streamTimer?entryTimestamp=${entryTimestamp}`);

    const timerDisplay = document.getElementById("timerDisplay");

    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        timerDisplay.textContent = data.timeRemaining;

        if (data.nearingExpiry) {
            timerDisplay.classList.add("warning");
        } else {
            timerDisplay.classList.remove("warning");
        }
    };

    eventSource.onerror = () => {
        console.log("Stream closed");
        if (eventSource) eventSource.close();
    };
});

document.getElementById("stopBtn").addEventListener("click", () => {
    if (eventSource) {
        eventSource.close();
        document.getElementById("timerDisplay").textContent = "Timer stopped";
    }
});

//Standard Parking Space
document.getElementById("bookBtn").addEventListener("click", () => {
    fetch("http://localhost:3000/bookSpace", 
	{ method: "POST" })
        .then(res => res.json())
        .then(data => {
			const type = data.success ? "success" : "error";
			updateStatus(
                `Standard Space: ${data.message}
				\nUser: ${data.userId}
				\nSpace: ${data.spaceId}
				\n Time: ${data.timestampExpiry}`,type);
        })      
        .catch(err => {
            updateStatus("Error booking standard space", "error");
            console.error(err);
        });
});

//Disabled Parking Space
document.getElementById("bookDisabledBtn").addEventListener("click", () => {
    fetch("http://localhost:3000/bookDisabledSpace", 
	{ method: "POST" })
        .then(res => res.json())
        .then(data => {
		const type = data.success ? "success" : "error";
//		updateStatus("Disabled Space: " + data.message, "success");
			updateStatus(
                `Disabled Space: ${data.message}
				\n User: ${data.userId}
				\n Space: ${data.spaceId} 
				\n Time: ${data.timestampExpiry}`, type);
        })      
        .catch(err => {
            updateStatus("Error booking disabled space", "error");
            console.error(err);
        });
});



