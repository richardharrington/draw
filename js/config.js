;

var APP = (typeof APP !== 'undefined') ? APP : {};
APP.config = (typeof APP.config !== 'undefined') ? APP.config :

[{
    DEFAULT_PALETTE_COLORS: ['B04141', '85224A', 'EBE3B2', '1A4F6B', '042B4F'],
    MAX_COLORS: 10,
    DEFAULT_PALETTE_TITLE: "default palette #1",
    DEFAULT_COLOR_PANEL_INDEX: 0,
    LARGE_BRUSH_WIDTH: 25,
    SMALL_BRUSH_WIDTH: 10,
    DEFAULT_BRUSH_SIZE: "large",
    CANVAS_WIDTH: 600,
    CANVAS_HEIGHT: 400,
    CANVAS_BACKGROUND_COLOR: "EEE"
},
{
    DEFAULT_PALETTE_COLORS: ['000000', '333333', '666666', '999999', 'BBBBBB'],
    MAX_COLORS: 10,
    DEFAULT_PALETTE_TITLE: "default palette #2",
    DEFAULT_COLOR_PANEL_INDEX: 0,
    LARGE_BRUSH_WIDTH: 50,
    SMALL_BRUSH_WIDTH: 30,
    DEFAULT_BRUSH_SIZE: "large",
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 300,
    CANVAS_BACKGROUND_COLOR: "FFF"
}, 
{
    DEFAULT_PALETTE_COLORS: ['003366', '336699', '6699BB', '99BBEE', 'BBEE11',
                             '060E18', '002E63', '0076FE', 'DBDADC', 'D0FDFE'],
    MAX_COLORS: 10,
    DEFAULT_PALETTE_TITLE: "default palette #3",
    DEFAULT_COLOR_PANEL_INDEX: 3,
    LARGE_BRUSH_WIDTH: 80,
    SMALL_BRUSH_WIDTH: 5,
    DEFAULT_BRUSH_SIZE: "small",
    CANVAS_WIDTH: 700,
    CANVAS_HEIGHT: 1000,
    CANVAS_BACKGROUND_COLOR: "FEB"
}];
