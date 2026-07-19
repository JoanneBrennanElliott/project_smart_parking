let eventSource = null;


function updateStatus(message, type = "success") {
    const box = document.getElementById("statusBox");
    box.textContent = message;
   // box.className = ""; // reset 
    box.classList.remove("success", "error");
	box.classList.add(type);
}


function formatLastLogin(timestamp) {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    const now = new Date();

    const oneDay = 24 * 60 * 60 * 1000;
    const diff = now - date;

    const timeString = date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit"
    });

    if (date.toDateString() === now.toDateString()) {
        return `Today at ${timeString}`;
    }

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday at ${timeString}`;
    }

    if (diff < 7 * oneDay) {
        const weekday = date.toLocaleDateString("en-GB", { weekday: "long" });
        return `${weekday} at ${timeString}`;
    }

    const dateString = date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

    return `${dateString} at ${timeString}`;
}


// New Navigation Bar Actions

document.addEventListener("DOMContentLoaded", () => {
    const navHome = document.getElementById("navHome");
    const navBook = document.getElementById("navBook");
    const navFindCar = document.getElementById("navFindCar");
    const navLogout = document.getElementById("navLogout");

    if (!navHome || !navBook || !navFindCar || !navLogout) {
        console.warn("Bottom nav buttons not found in DOM");
        return;
    }

    navHome.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    navBook.addEventListener("click", () => {
        const bookingCard = document.querySelector(".card");
        if (bookingCard) bookingCard.scrollIntoView({ behavior: "smooth" });
    });

    navFindCar.addEventListener("click", () => {
        const findCarSection = document.getElementById("findCarBtn");
        if (findCarSection) findCarSection.scrollIntoView({ behavior: "smooth" });
    });

    navLogout.addEventListener("click", () => {
      document.getElementById("logoutBtn").click();
	  
	 
   /*     const panel = document.getElementById("loginPanel");
		
		        // Bring login panel back
        panel.style.display = "block";
        panel.classList.remove("fadeOut");
        panel.style.opacity = "1";
		*/
		
   setTimeout(() => {
        const logo = document.querySelector(".logo-container");
        if (logo) {
            logo.scrollIntoView({ behavior: "smooth" });
        } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, 150);
    });
});


document.getElementById("loginBtn").addEventListener("click", async () => {

	
   const username = document.getElementById("loginName").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
	
	document.getElementById("findCarBtn").disabled = false;
	
	const loginStatus = document.getElementById("loginStatus");
	
    const disabledAccess = document.getElementById("disabledAccess").checked ? 1 : 0;
    const permitNumber = document.getElementById("permitNumber").value.trim();
    const loginExpiryDate = document.getElementById("expiryDate").value;
	//const email = document.getElementById("email").value.trim();


	 try {
        const response = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
//            body: JSON.stringify({ username, password })
            body: JSON.stringify({ username, password, disabledAccess, permitNumber,  loginExpiryDate })
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
			window.currentLoggedInUser = username;
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
			
			const carReg = document.getElementById("carReg");
			carReg.disabled = false;

			carReg.focus();
			panel.classList.add("fadeOut");
			
			document.getElementById("loggedInUserDisplay").textContent =
			`Logged in as: ${username}`;

			// new show permit number
			document.getElementById("permitDisplay").textContent =
			result.permitNumber ? `Permit: ${result.permitNumber}` : "";

			document.getElementById("expiryDisplay").textContent =
			result.expiryDate ? `Permit Expiry: ${result.expiryDate}` : "";
			
			//new 
			document.getElementById("bookingEmail").value = result.email || "";
			

			document.getElementById("bookBtn").disabled = false;
			//document.getElementById("bookDisabledBtn").disabled = false;
			

			if (!result.disabledAccess) {
				const btn = document.getElementById("bookDisabledBtn");
				btn.disabled = true;
				btn.title = "Disabled parking permit required";
			} else {
				const btn = document.getElementById("bookDisabledBtn");
				btn.disabled = false;
				btn.title = "";
			}
			
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

				registerBtn.style.display = "block";

			} else {

//				loginStatus.textContent = "Login Unsuccessful";
				loginStatus.textContent = result.message || "Login Unsuccessful";
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
	
document.getElementById("disabledAccess").addEventListener("change", function () {
const permitInput = document.getElementById("permitNumber");
  const expiryInput = document.getElementById("expiryDate");  // added expiryDate of pass

if (this.checked) {
	permitInput.disabled = false;
	permitInput.placeholder = "Enter permit number";
	expiryInput.disabled = false;
} else {
	permitInput.disabled = true;
	permitInput.value = "";
	expiryInput.disabled = true;
	expiryInput.value = "";
	permitInput.placeholder = "Not selected";
}
});


document.getElementById("registerBtn").addEventListener("click", () => {
    

    const username = document.getElementById("loginName").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
	
	// Newly added disabledAccess, permitNumber, expiryDate
	const disabledAccess = document.getElementById("disabledAccess").checked ? 1 : 0;
	const permitNumber = document.getElementById("permitNumber").value.trim();
	const expiryDate = document.getElementById("expiryDate").value;
  
    fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, disabledAccess, //added  disabledAccess
		permitNumber, expiryDate })  
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

document.getElementById("findCarBtn").addEventListener("click", async () => {
    const resultBox = document.getElementById("findCarResult");
    resultBox.textContent = "Searching...";
    resultBox.className = "info";

    try {
        const response = await fetch("/findMyCar", {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });

        const result = await response.json();

        if (!result.success) {
            resultBox.textContent = result.message;
            resultBox.className = "error";
            return;
        }

        // Success
        resultBox.className = "success";
        resultBox.textContent =
            `Your car is parked in Zone ${result.zone}, Space ${result.spaceId}.`;

		// Enable navigation button
		document.getElementById("navigateToCarBtn").disabled = false;

		// Store values for popup
		window.lastCarZone = result.zone;
		window.lastCarSpace = result.spaceId;
	
    } catch (err) {
        console.error("Find My Car error:", err);
        resultBox.textContent = "Server error while locating your car";
        resultBox.className = "error";
    }
});


document.getElementById("logoutBtn").addEventListener("click", () => {


		console.log("Logout1: timerDisplay =", window.timerDisplay);
		
	//turn off timer stream and clear if logging outerHeight   
	 if (window.eventSource) {
			window.eventSource.onmessage = null;
			window.eventSource.onerror = null;
			window.eventSource.close();
			window.eventSource = null;
		}


	if (window.timerDisplay) {
        clearInterval(window.timerDisplay);
        window.timerDisplay = null;
    }
	console.log("Logout2: timerDisplay =", window.timerDisplay);
	
		if (window.currentLoggedInUser) {
			fetch(`/stopTimer?userId=${window.currentLoggedInUser}`);
		}

		window.currentLoggedInUser = null;
		
		window.timerRunning = false;
		document.getElementById("timerDisplay").textContent = "Timer stopped";
		const bar = document.getElementById("progressBar");
		bar.style.width = "100%";
		bar.classList.remove("warning", "expired");

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
		document.getElementById("bookDisabledBtn").title = "Please log in first";
		document.getElementById("disabledAccess").checked = false;

		document.getElementById("permitDisplay").textContent = "";
		document.getElementById("permitNumber").value = "";
		document.getElementById("permitNumber").disabled = true;
		document.getElementById("permitNumber").placeholder = "Not selected";
		document.getElementById("expiryDisplay").textContent = "";
		document.getElementById("expiryDate").value = "";
		document.getElementById("expiryDate").disabled = true;

		document.getElementById("bookingEmail").textContent = "";
		document.getElementById("bookingEmail").value = "";

		document.getElementById("evCheckbox").checked = false;


        // Disable navigation
        document.getElementById("navigateToCarBtn").disabled = true;
        window.lastCarZone = "";
        window.lastCarSpace = "";
		
		
	if (window.timerDisplay) {
        clearInterval(window.timerDisplay);
        window.timerDisplay = null;
    }
	console.log("Logout3: timerDisplay =", window.timerDisplay);


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




const navigatePopup = document.getElementById("navigatePopup");
const navigateText = document.getElementById("navigateText");
const navigateBtn = document.getElementById("navigateBtn");

// Open popup when user clicks "Navigate to My Car"
document.getElementById("navigateToCarBtn").addEventListener("click", () => {
    navigateText.textContent = `Your car is in Zone ${window.lastCarZone}, Space ${window.lastCarSpace}.`;
    navigatePopup.style.display = "flex";
});

// Close popup
document.getElementById("closeNavigatePopup").addEventListener("click", () => {
    navigatePopup.style.display = "none";
});

// Open Google Maps
navigateBtn.addEventListener("click", () => {
    const zone = window.lastCarZone;
    const space = window.lastCarSpace;
	
	  navigatePopup.style.display = "none";

    const label = encodeURIComponent(`Car: ${zone}-${space}`);
    //const lat = 53.388;   // example coords - WIP  - TODO if time allows
    //const lng = -6.417;
    const lat = 53.2766667;   // example coords - WIP  - TODO if time allows
    const lng = -6.2197222;		// Beacon Hospital (decimal)

    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${label}`;

    window.open(url, "_blank");
});


document.getElementById("startBtn").addEventListener("click", () => {
	
    const entryTimestamp = new Date().toISOString();
    const timerDisplay = document.getElementById("timerDisplay");
	//const username = document.getElementById("loginName").value.trim();
	//window.currentLoggedInUser = username;

		if (!window.currentLoggedInUser) {
     //if (!username) {
        alert("Please log in before starting the timer.");
        return;
    }
	
    //console.log("Starting parking timer stream…");
   console.log("Starting timer for:", window.currentLoggedInUser);
   
       //Prevent double-start
    if (window.timerRunning) {
        console.log("Timer already running — ignoring second start");
        return;
    }
	  window.timerRunning = true;
   
     // Pass BOTH userId + entryTimestamp to Node
    window.eventSource = new EventSource(
        `/startTimer?entryTimestamp=${entryTimestamp}&userId=${window.currentLoggedInUser}`
    );
	
    timerDisplay.textContent = "Starting timer…";

	window.eventSource.onmessage = (event) => {
		const data = JSON.parse(event.data);


		// Parse "Xm Ys" into seconds
		const parts = data.timeRemaining.split(" ");
		let minutes = parseInt(parts[0].replace("m", ""));
		let seconds = parseInt(parts[1].replace("s", ""));
		let remainingSeconds = minutes * 60 + seconds;

		//  total parking time (adjust if needed)
		const totalSeconds = 5 * 60; // 30 minutes
		
		//const totalSeconds = 2 * 60; // 2 minutes......TODO
	   // Update text
		timerDisplay.textContent = data.timeRemaining;

		// Calculate progress %
		let percent = (remainingSeconds / totalSeconds) * 100;

		// Update progress bar
		const bar = document.getElementById("progressBar");
		bar.style.width = percent + "%";

		// Colour logic
		if (data.nearingExpiry) {
			bar.classList.add("warning");
		} else {
			bar.classList.remove("warning");
		}

		if (remainingSeconds <= 0) {
			bar.classList.add("expired");
		}
	};

      window.eventSource.onerror = () => {
        console.log("Timer connection closed");
        if (window.eventSource) window.eventSource.close();
    };

});

	//Original version had this working through the bridge.js
  	//eventSource = new EventSource(`http://localhost:3000/streamTimer?entryTimestamp=${entryTimestamp}`);

 /*   eventSource.onmessage = (event) => {
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
*/



document.getElementById("stopBtn").addEventListener("click", () => {
 
   if (window.eventSource) {
        window.eventSource.close();
        window.eventSource = null;
    }

	//need to explicity call cancel JBE 18/7/26
  fetch(`/stopTimer?userId=${window.currentLoggedInUser}`);

	window.timerRunning = false;
    document.getElementById("timerDisplay").textContent = "Timer stopped";
    //document.getElementById("timerDisplay").classList.remove("warning");
	const bar = document.getElementById("progressBar");
    bar.style.width = "100%";
    bar.classList.remove("warning", "expired");
	
    console.log("Timer manually stopped");

});

//Standard Parking Space
document.getElementById("bookBtn").addEventListener("click", () => {
	
	const carReg = document.getElementById("carReg").value.trim();
	
	const email = document.getElementById("bookingEmail").value.trim();

	const isEV = document.getElementById("evCheckbox").checked;

	if (!email || !email.includes("@")) {
		statusBox.textContent = "Please enter a valid email before booking.";
		statusBox.className = "error";
		return;
	}

		
    fetch("http://localhost:3000/bookSpace", 
	{ 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carReg, email, isEV   })
		})
		
        .then(res => res.json())
        .then(data => {
			const type = data.success ? "success" : "error";
			updateStatus(
                `Space: ${data.message}
				\nUser: ${data.userId}
			    \nCar Reg: ${data.carReg}
				\nSpace: ${data.spaceId}
				\nRef: ${data.bookingRef}
				\n Time: ${data.timestampExpiry}`,type);
        })      
        .catch(err => {
            updateStatus("Error booking space", "error");
            console.error(err);
        });
});

//Disabled Parking Space
document.getElementById("bookDisabledBtn").addEventListener("click", () => {
    
	const carReg = document.getElementById("carReg").value.trim();
	 
	const email = document.getElementById("bookingEmail").value.trim();

	if (!email || !email.includes("@")) {
		statusBox.textContent = "Please enter a valid email before booking.";
		statusBox.className = "error";
		return;
	}

	 
	 fetch("http://localhost:3000/bookDisabledSpace", 
	{ 
	 method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carReg, email  })
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




