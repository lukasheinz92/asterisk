// DOM manipulation utilities
export class DOMUtils {

    // Create element with attributes and properties
    static createElement(tagName, attributes = {}) {
        const element = document.createElement(tagName);

        for (const [key, value] of Object.entries(attributes)) {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'textContent') {
                element.textContent = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else {
                element.setAttribute(key, value);
            }
        }

        return element;
    }

    // Toggle class based on condition
    static toggleClass(element, className, condition) {
        if (condition) {
            element.classList.add(className);
        } else {
            element.classList.remove(className);
        }
    }
}
