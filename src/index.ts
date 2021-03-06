const XMLNS = 'http://www.w3.org/2000/svg';

export class SmartBoard {

    public svg: SVGElement;
    public x: number = 0;
    public y: number = 0;
    public target: EventTarget;
    public entities: Array<PathEntity> = [];

    constructor({ parent }: { parent: HTMLElement }) {

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

    handleEvent(event: Event) {

        event.stopImmediatePropagation();
        event.preventDefault();

        switch (event.type) {
            case 'mousemove':
                this.updateCoords((<MouseEvent>event).offsetX, (<MouseEvent>event).offsetY);
                this.target.dispatchEvent(new CustomEvent('xy', { detail: event }));
                break;
            case 'mousedown':
                this.handleMouseDown(event as MouseEvent);
                break;
            default:
                break;
        }
    }

    updateCoords(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    handleMouseDown(event: MouseEvent) {

        if (!this.x || !this.y) {

            this.updateCoords((<MouseEvent>event).offsetX, (<MouseEvent>event).offsetY);
        }

        let entity = new PathEntity({ smartBoard: this, x: this.x, y: this.y });

        this.entities.push(entity);
    }
}

interface Part {
    x: number;
    y: number;
}

class PathEntity {

    public element: SVGPathElement;

    private smartBoard: SmartBoard;
    public parts: Array<Part> = [];

    constructor({ smartBoard, x, y }: { smartBoard: SmartBoard, x: number, y: number }) {

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

        this.parts.push({x, y});

        smartBoard.target.addEventListener('xy', this.handleXyDraw);

        document.addEventListener('mouseup', this.handleMouseUpDraw, { capture: true, once: true });
    }

    dispose() { }

    handleMouseDown(event: MouseEvent) {

        event.stopPropagation();
        event.preventDefault();

        this.smartBoard.target.addEventListener('xy', this.handleXyMove);

        document.addEventListener('mouseup', this.handleMouseUpMove, { capture: true, once: true });
    }

    handleMouseUpMove(event: MouseEvent) {

        this.smartBoard.target.removeEventListener('xy', this.handleXyMove);

        this.element.addEventListener('mousedown', this.handleMouseDown, { capture: true, once: true });

        this.smartBoard.target.dispatchEvent(new CustomEvent('drawing_changed', { detail: this.smartBoard.entities }));

        console.log(this.smartBoard.entities);

    }

    handleMouseUpDraw(event: MouseEvent) {

        this.smartBoard.target.removeEventListener('xy', this.handleXyDraw);

        this.element.addEventListener('mousedown', this.handleMouseDown, { capture: true, once: true });

        this.smartBoard.target.dispatchEvent(new CustomEvent('drawing_changed', { detail: this.smartBoard.entities }));

        console.log(this.smartBoard.entities);
    }

    handleXyDraw(event: Event) {

        event.stopPropagation();
        event.preventDefault();

        let { offsetX: x, offsetY: y } = (event as CustomEvent).detail;

        this.parts.push({x, y});

        this.render();
    }

    handleXyMove(event: Event) {

        let { movementX: x, movementY: y } = (event as CustomEvent).detail;

        for (let i = 0; i < this.parts.length; i++) {

            this.parts[i]['x'] = this.parts[i]['x'] + x;
            this.parts[i]['y'] = this.parts[i]['y'] + y;
        }

        this.render();
    }

    render() {

        let lineTo = '';

        for (let i = 1; i < this.parts.length; i++) {

            lineTo = lineTo + ` L ${this.parts[i]['x']} ${this.parts[i]['y']}`
        }

        let d = `M ${this.parts[0]['x']} ${this.parts[0]['y']}` + lineTo;

        this.element.setAttributeNS(null, 'd', d);
    }
}