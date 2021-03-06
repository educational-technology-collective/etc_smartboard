const XMLNS = 'http://www.w3.org/2000/svg';
export class SmartBoard {
    constructor({ parent }) {
        this.x = 0;
        this.y = 0;
        this.entities = [];
        this.target = new EventTarget();
        const svg = document.createElementNS(XMLNS, 'svg');
        svg.setAttributeNS(null, 'width', '100%');
        svg.setAttributeNS(null, 'height', '100%');
        parent.appendChild(svg);
        svg.addEventListener('mousemove', this);
        svg.addEventListener('mousedown', this);
        this.svg = svg;
    }
    dispose() {
    }
    handleEvent(event) {
        event.stopImmediatePropagation();
        event.preventDefault();
        switch (event.type) {
            case 'mousemove':
                this.updateCoords(event.offsetX, event.offsetY);
                this.target.dispatchEvent(new CustomEvent('xy', { detail: event }));
                break;
            case 'mousedown':
                this.handleMouseDown(event);
                break;
            default:
                break;
        }
    }
    updateCoords(x, y) {
        this.x = x;
        this.y = y;
    }
    handleMouseDown(event) {
        if (!this.x || !this.y) {
            this.updateCoords(event.offsetX, event.offsetY);
        }
        let entity = new PathEntity({ smartBoard: this, x: this.x, y: this.y });
        this.entities.push(entity);
    }
}
class PathEntity {
    constructor({ smartBoard, x, y }) {
        this.parts = [];
        this.handleXyDraw = this.handleXyDraw.bind(this);
        this.handleXyMove = this.handleXyMove.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUpDraw = this.handleMouseUpDraw.bind(this);
        this.handleMouseUpMove = this.handleMouseUpMove.bind(this);
        this.smartBoard = smartBoard;
        let element = this.element = document.createElementNS(XMLNS, 'path');
        element.setAttributeNS(null, 'stroke', 'black');
        element.setAttributeNS(null, 'fill', 'none');
        element.setAttributeNS(null, 'stroke-width', '2');
        this.smartBoard.svg.appendChild(element);
        this.parts.push({ x, y });
        smartBoard.target.addEventListener('xy', this.handleXyDraw);
        document.addEventListener('mouseup', this.handleMouseUpDraw, { capture: true, once: true });
    }
    dispose() { }
    handleMouseDown(event) {
        event.stopPropagation();
        event.preventDefault();
        this.smartBoard.target.addEventListener('xy', this.handleXyMove);
        document.addEventListener('mouseup', this.handleMouseUpMove, { capture: true, once: true });
    }
    handleMouseUpMove(event) {
        this.smartBoard.target.removeEventListener('xy', this.handleXyMove);
        this.element.addEventListener('mousedown', this.handleMouseDown, { capture: true, once: true });
        this.smartBoard.target.dispatchEvent(new CustomEvent('drawing_changed', { detail: this.smartBoard.entities }));
        console.log(this.smartBoard.entities);
    }
    handleMouseUpDraw(event) {
        this.smartBoard.target.removeEventListener('xy', this.handleXyDraw);
        this.element.addEventListener('mousedown', this.handleMouseDown, { capture: true, once: true });
        this.smartBoard.target.dispatchEvent(new CustomEvent('drawing_changed', { detail: this.smartBoard.entities }));
        console.log(this.smartBoard.entities);
    }
    handleXyDraw(event) {
        event.stopPropagation();
        event.preventDefault();
        let { offsetX: x, offsetY: y } = event.detail;
        this.parts.push({ x, y });
        this.render();
    }
    handleXyMove(event) {
        let { movementX: x, movementY: y } = event.detail;
        for (let i = 0; i < this.parts.length; i++) {
            this.parts[i]['x'] = this.parts[i]['x'] + x;
            this.parts[i]['y'] = this.parts[i]['y'] + y;
        }
        this.render();
    }
    render() {
        let lineTo = '';
        for (let i = 1; i < this.parts.length; i++) {
            lineTo = lineTo + ` L ${this.parts[i]['x']} ${this.parts[i]['y']}`;
        }
        let d = `M ${this.parts[0]['x']} ${this.parts[0]['y']}` + lineTo;
        this.element.setAttributeNS(null, 'd', d);
    }
}
