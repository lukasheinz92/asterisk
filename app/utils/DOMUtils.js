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

    // Add multiple classes
    static addClasses(element, ...classNames) {
        element.classList.add(...classNames);
    }

    // Remove multiple classes
    static removeClasses(element, ...classNames) {
        element.classList.remove(...classNames);
    }

    // Check if element has class
    static hasClass(element, className) {
        return element.classList.contains(className);
    }

    // Get elements by class name
    static getElementsByClass(className, parent = document) {
        return parent.querySelectorAll(`.${className}`);
    }

    // Get element by ID
    static getElementById(id) {
        return document.getElementById(id);
    }

    // Set multiple attributes
    static setAttributes(element, attributes) {
        for (const [key, value] of Object.entries(attributes)) {
            element.setAttribute(key, value);
        }
    }

    // Remove element from DOM
    static removeElement(element) {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }

    // Empty element content
    static empty(element) {
        element.innerHTML = '';
    }

    // Show element
    static show(element, displayType = 'block') {
        element.style.display = displayType;
    }

    // Hide element
    static hide(element) {
        element.style.display = 'none';
    }

    // Add event listener with options
    static addEventListener(element, event, handler, options = {}) {
        element.addEventListener(event, handler, options);
    }

    // Remove event listener
    static removeEventListener(element, event, handler, options = {}) {
        element.removeEventListener(event, handler, options);
    }
}