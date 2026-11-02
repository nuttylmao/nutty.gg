
class ConnectionStatus {
    constructor({
        target = document.body,
        name = "Service",
        disconnectedMessage,
        className = "",
        showDelay = 0,
    } = {}) {
        this.name = name;
        this.showDelay = showDelay;
        this.wasConnected = false;
        this.disconnectTimer = null;

        // Generate a CSS class from the service name.
        const serviceClass = {
            "Streamer.bot": "connection-status--streamerbot",
        }[name] || "";

        this.element = document.createElement("div");
        this.element.className = [
            "connection-status",
            serviceClass,
            className
        ].filter(Boolean).join(" ");

        this.element.setAttribute("role", "status");
        this.element.setAttribute("aria-live", "polite");
        this.element.hidden = true;

        this.disconnectedMessage =
            disconnectedMessage ?? `${name} disconnected`;

        target.appendChild(this.element);
    }

    setConnected(connected) {
        clearTimeout(this.disconnectTimer);
        this.disconnectTimer = null;

        if (connected) {
            this.wasConnected = true;
            this.hide();
            return;
        }

        this.disconnectTimer = setTimeout(() => {
            this.show(this.disconnectedMessage);
        }, this.showDelay);
    }

    show(message) {
        this.element.textContent = message;
        this.element.hidden = false;
        this.element.classList.remove("is-visible");

        void this.element.offsetHeight;

        this.element.classList.add("is-visible");
    }

    hide() {
        this.element.classList.remove("is-visible");

        setTimeout(() => {
            if (!this.element.classList.contains("is-visible")) {
                this.element.hidden = true;
            }
        }, 220);
    }

    destroy() {
        clearTimeout(this.disconnectTimer);
        this.element.remove();
    }
}
