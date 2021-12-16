import { SmartBoard } from './etc_smartboard/index.js';

let wrapper = document.getElementById('wrapper');

if (wrapper) {

    let smartBoard = new SmartBoard({ parent: wrapper });
}