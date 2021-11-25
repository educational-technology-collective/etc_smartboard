const XMLNS = 'http://www.w3.org/2000/svg';

class SmartBoard {

    public svg: SVGElement;
    public x?: number;
    public y?: number;
    public target: EventTarget;

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
                this.handleMouseMove(event as MouseEvent);
                break;
            case 'mousedown':
                this.handleMouseDown(event as MouseEvent);
                break;
            default:
                break;
        }
    }

    handleMouseMove(event: MouseEvent) {
        this.x = event.offsetX;
        this.y = event.offsetY;
    }

    handleMouseDown(event: MouseEvent) {

        if (!this.x || !this.y) {

            this.x = event.offsetX;
            this.y = event.offsetY;
        }

        let entity = new PathEntity({ smartBoard: this, x: this.x, y: this.y });

        this.target.dispatchEvent(new CustomEvent('xy', {
            detail: event
        }));
    }
}

class PathEntity {

    public element: SVGPathElement;

    private smartBoard: SmartBoard;
    private path: Array<Array<number>> = [];
    private entitySelection: EntitySelection;

    constructor({ smartBoard, x, y }: { smartBoard: SmartBoard, x: number, y: number }) {

        this.handleXyDraw = this.handleXyDraw.bind(this);
        this.handleXyMove = this.handleXyMove.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUpDraw = this.handleMouseUpDraw.bind(this);
        this.handleMouseUpMove = this.handleMouseUpMove.bind(this);

        this.smartBoard = smartBoard;

        let entitySelection = this.entitySelection = new EntitySelection();

        const xmlns = 'http://www.w3.org/2000/svg';

        smartBoard.target.addEventListener('xy', this.handleXyDraw);
        smartBoard.target.addEventListener('xy', entitySelection.handleXy);


        let element = this.element = document.createElementNS(xmlns, 'path');

        element.setAttributeNS(null, 'stroke', 'black');
        element.setAttributeNS(null, 'fill', 'none');
        element.setAttributeNS(null, 'stroke-width', '2');
        element.addEventListener('mousedown', this.handleMouseDown, false);

        document.addEventListener('mouseup', this.handleMouseUpDraw, { capture: true, once: true });

        this.smartBoard.svg.appendChild(element);
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
    }

    handleMouseUpDraw(event: MouseEvent) {

        this.smartBoard.target.removeEventListener('xy', this.handleXyDraw);
    }

    handleXyDraw(event: Event) {

        event.stopPropagation();
        event.preventDefault();

        let { offsetX: x, offsetY: y } = (event as CustomEvent).detail;

        this.path.push([x, y]);

        this.render();
    }

    handleXyMove(event: Event) {

        let { movementX: x, movementY: y } = (event as CustomEvent).detail;

        for (let i = 0; i < this.path.length; i++) {

            this.path[i][0] = this.path[i][0] + x;
            this.path[i][1] = this.path[i][1] + y;
        }

        this.render();
        this.entitySelection.render();
    }

    render() {

        let lineTo = '';

        for (let i = 1; i < this.path.length; i++) {

            lineTo = lineTo + ` L ${this.path[i][0]} ${this.path[i][1]}`
        }

        let d = `M ${this.path[0][0]} ${this.path[0][1]}` + lineTo;

        this.element.setAttributeNS(null, 'd', d);
    }
}

class EntitySelection {

    private minX: number = Number.MAX_SAFE_INTEGER;
    private minY: number = Number.MAX_SAFE_INTEGER;
    private maxX: number = 0;
    private maxY: number = 0;
    private element: SVGRectElement;

    constructor() {

        let element = this.element = document.createElementNS(XMLNS, 'rect');

        this.element.setAttributeNS(null, 'stroke', 'black');
        this.element.setAttributeNS(null, 'stroke-dasharray', '4 1');
    }

    handleXy(event: Event) {

        let { offsetX: x, offsetY: y } = (event as CustomEvent).detail;

        if (x < this.minX) {
            this.minX = x;
        }

        if (y < this.minY) {
            this.minY = y;
        }

        if (x > this.maxX) {
            this.maxX = x;
        }

        if (y > this.maxY) {
            this.maxY = y;
        }
    }

    render() {

        this.element.setAttributeNS(null, 'x', this.minX.toString());
        this.element.setAttributeNS(null, 'y', this.minY.toString());
        this.element.setAttributeNS(null, 'width', (this.maxX - this.minX).toString());
        this.element.setAttributeNS(null, 'height', (this.maxY - this.minY).toString());
    }
}

let wrapper = document.getElementById('wrapper');

if (wrapper) {

    let smartBoard = new SmartBoard({ parent: wrapper });

    setInterval(() => {

        let svg = document.querySelector('#wrapper svg');

        let test = document.getElementById('test');

        if (svg && test) {

            [...test.children].forEach((value: Element) => test?.removeChild(value));

            svg = svg.cloneNode(true) as Element;

            svg.setAttributeNS(null, 'width', '200');
            svg.setAttributeNS(null, 'height', '200');
            svg.setAttributeNS(null, 'viewBox', '0 0 500 500');

            test.appendChild(svg);
        }

    }, 1000);

    let target = document.getElementById('target');

    target?.addEventListener('mousedown', (event: Event)=>{
        console.log(event);
    });

    let line = document.getElementById('line');

    line?.addEventListener('mousedown', (event: Event)=>{
        console.log("line");
    });
}

