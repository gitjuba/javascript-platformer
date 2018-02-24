
const editorState = {
    deleteObject: false,
    selectedObject: undefined,
    newObjectType: Objects.OBSTACLE,
    newObject: undefined,
    levelObjects: []
};

const snapToGrid = val => GRID_SIZE*Math.round(val/GRID_SIZE);

const getObjectUnderCursor = () => {
    const objectsUnderCursor = [];
    for (let i = 0; i < levelObjects.length; i++) {
        const object = levelObjects[i];
        if (collidePointRectangle(mouseX, mouseY, object.x, object.y, object.w, object.h)) {
            objectsUnderCursor.push(i);
        }
    }
    if (objectsUnderCursor.length > 0) {
        // In the case of several overlapping objects, return the one with largest index, i.e. the one added most recently.
        return Math.max(...objectsUnderCursor);
    } else {
        return undefined;
    }
};

const checkDimensions = obj => {
    if (obj.w === 0 || obj.h === 0) {
        return false;
    }
    if (obj.w < 0) {
        obj.x += obj.w;
        obj.w *= -1;
    }
    if (obj.h < 0) {
        obj.y += obj.h;
        obj.h *= -1;
    }
    return true;
};

const handleMouseMove = e => {
    mouseX = e.clientX - rect.left - root.scrollLeft;
    mouseY = e.clientY - rect.top - root.scrollTop;
    if (editorState.selectedObject !== undefined) {
        levelObjects[editorState.selectedObject].x = snapToGrid(mouseX - dragOffsetX);
        levelObjects[editorState.selectedObject].y = snapToGrid(mouseY - dragOffsetY);
    } else if (editorState.newObject !== undefined) {
        if (editorState.newObjectType === Objects.OBSTACLE) {
            editorState.newObject.w = snapToGrid(mouseX - editorState.newObject.x);
            editorState.newObject.h = snapToGrid(mouseY - editorState.newObject.y);
        } else {
            editorState.newObject.x = snapToGrid(mouseX);
            editorState.newObject.y = snapToGrid(mouseY);
        }
    }
};

const handleMouseDown = () => {
    editorState.selectedObject = getObjectUnderCursor();
    if (editorState.selectedObject !== undefined) {
        if (editorState.deleteObject) {
            levelObjects.splice(Number(editorState.selectedObject), 1);
            editorState.selectedObject = undefined;
        } else {
            dragOffsetX = mouseX - levelObjects[editorState.selectedObject].x;
            dragOffsetY = mouseY - levelObjects[editorState.selectedObject].y;
        }
    } else {
        if (editorState.newObjectType !== Objects.OBSTACLE) {
            // There can be only one start and one goal.
            removeObjectOfType(editorState.newObjectType);
        }
        const newObjWidth = editorState.newObjectType === Objects.OBSTACLE ? 0 : PLAYER_W;
        const newObjHeight = editorState.newObjectType === Objects.OBSTACLE ? 0 : PLAYER_H;
        editorState.newObject = {
            type: editorState.newObjectType,
            x: snapToGrid(mouseX),
            y: snapToGrid(mouseY),
            w: newObjWidth,
            h: newObjHeight
        };
    }
};

const handleMouseUp = () => {
    editorState.selectedObject = undefined;
    if (editorState.newObject !== undefined) {
        if (checkDimensions(editorState.newObject)) {
            levelObjects.push(editorState.newObject);
        }
        editorState.newObject = undefined;
    }
};

const handleKeyDown = (e) => {
    switch (e.keyCode) {
        case 83: // 's'
            editorState.newObjectType = Objects.PLAYER;
            break;
        case 71: // 'g'
            editorState.newObjectType = Objects.GOAL;
            break;
        case 79: // 'o'
            editorState.newObjectType = Objects.OBSTACLE;
            break;
        case 80: // 'p'
            console.log(JSON.stringify(editorState.levelObjects).replace(/"/g, ''));
            break;
        case 16: // shift
            editorState.deleteObject = true;
            break;
        default:
            console.log(e.keyCode);
            break;
    }
};

const handleKeyUp = e => {
    switch (e.keyCode) {
        case 16:
            editorState.deleteObject = false;
            break;
        default:
            break;
    }
};

const startLevelEditor = (level) => {
    editorState.levelObjects = level;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
};

const quitLevelEditor = () => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mousedown', handleMouseDown);
    window.removeEventListener('mouseup', handleMouseUp);
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
};
