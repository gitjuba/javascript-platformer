
// Simple boolean collision checks

const collidePointRectangle = (x0, y0, x1, y1, w1, h1) => {
    return x0 > x1 && x0 < x1 + w1 && y0 > y1 && y0 < y1 + h1;
};
