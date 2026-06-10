let eventSource = null;


function updateStatus(message, type = "success") {
    const box = document.getElementById("statusBox");
    box.textContent = message;
   // box.className = ""; // reset classes
   // Reset classes
    box.classList.remove("success", "error");
	box.classList.add(type);
}

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



