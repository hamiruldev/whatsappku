function logout() {
  try {
    // Clear the PocketBase instance (if applicable)
    if (window.pb && typeof window.pb.authStore !== "undefined") {
      window.pb.authStore.clear();
    }

    // Clear session-related data
    window.pb = null;
    localStorage.removeItem("authToken"); // If you store tokens
    sessionStorage.clear();

    // Redirect to login page
    window.location.href = "/login";
  } catch (error) {
    console.error("Logout error:", error);
    window.location.href = "/login"; // Ensure redirect even on error
  }
}

function showNotification(message, type) {
  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification zindexToast p-4 rounded-lg text-white ${
    type === "success" ? "bg-green-500" : "bg-red-500"
  }`;
  notification.textContent = message;

  // Append notification to the body
  document.body.prepend(notification);

  // Position it based on screen size
  positionNotification(notification);

  // Remove notification after 3 seconds
  setTimeout(() => notification.remove(), 3000);
}

function positionNotification(notification) {
  const isMobile = window.innerWidth <= 768;

  notification.style.zIndex = "1";
  // Styles for mobile (bottom center)
  if (isMobile) {
    notification.style.position = "fixed";
    notification.style.bottom = "2dvh";
    notification.style.left = "50%";
    notification.style.transform = "translateX(-50%)";
  } else {
    // Styles for desktop (bottom right)
    notification.style.position = "fixed";
    notification.style.bottom = "2dvh";
    notification.style.right = "30%";
  }
}

function updateTimeToDate(arr) {
  return arr.map((item) => {
    const [day, month, year, hour, minute] = item.time.match(/\d+/g);

    return {
      ...item,
      time: new Date(year, month - 1, day, hour, minute) // Create new Date object
    };
  });
}

function getFormattedNow() {
  return new Date();
}

function replaceCusInMeId(data) {
  // Check if the data has the 'details' array
  if (data && Array.isArray(data.details)) {
    // Iterate through each session in the 'details' array
    data.details.forEach((session) => {
      // Check if the session has a 'me' object and 'me.id' field
      if (session.me && session.me.id) {
        // Replace '@c.us' with an empty string
        session.me.id = session.me.id.replace("@c.us", "");
      }
    });
  }
  return data; // Return the modified data
}

function addSuffix(text) {
  return text.endsWith("@c.us") ? text : text + "@c.us";
}

// Convert binary data to base64 in browser
function convertToBase64(buffer) {
  try {
    const binary = String.fromCharCode.apply(null, new Uint8Array(buffer));
    return btoa(binary); // btoa() encodes the string to base64
  } catch (error) {
    console.error("Error converting to base64:", error);
    return "";
  }
}

function isMobile() {
  const isMobileUserAgent = /Mobi|Android|iPhone|iPad|iPod/i.test(
    navigator.userAgent
  );
  const isSmallScreen = window.innerWidth <= 768; // Common breakpoint for mobile screens
  return isMobileUserAgent || isSmallScreen;
}

// Function to get a valid start time, 3 minutes ahead if needed
function getValidStartTime(startTime) {
  const currentDate = new Date(); // Current date and time
  const parsedDate = new Date(startTime);

  // Check if the time part is 00:00:00
  if (
    parsedDate.getHours() === 0 &&
    parsedDate.getMinutes() === 0 &&
    parsedDate.getSeconds() === 0
  ) {
    // Keep the date from parsedDate but use current time + 3 minutes
    parsedDate.setHours(currentDate.getHours());
    parsedDate.setMinutes(currentDate.getMinutes() + 3);
    parsedDate.setSeconds(currentDate.getSeconds());
    return parsedDate;
  }

  // Otherwise, return the provided date and time + 3 minutes
  parsedDate.setMinutes(parsedDate.getMinutes() + 3);
  return parsedDate;
}

function getTodayFormattedDateTime() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${day}${month}${year}_${hours}${minutes}${seconds}`;
}
