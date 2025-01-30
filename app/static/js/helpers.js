function showNotification(message, type) {
  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification p-4 rounded-lg text-white ${
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

  // Styles for mobile (bottom center)
  if (isMobile) {
    notification.style.position = "fixed";
    notification.style.bottom = "100px";
    notification.style.left = "50%";
    notification.style.transform = "translateX(-50%)";
  } else {
    // Styles for desktop (bottom right)
    notification.style.position = "fixed";
    notification.style.bottom = "20px";
    notification.style.right = "30%";
  }
}

function updateTimeToDate(arr) {
  return arr.map((item) => {
    const [day, month, year, hour, minute] = item.time.match(/\d+/g);

    return {
      ...item,
      time: new Date(year, month - 1, day, hour, minute), // Create new Date object
    };
  });
}

function getFormattedNow() {
  return new Date();
}
