declare interface Math {
    floor(x: number): number;
}


//% color=#27b0ba icon="\uf26c"
namespace OLED {


    /**
     * Select direction for drawing lines
     */
    export enum LineDirectionSelection {
        //% block="horizontal"
        horizontal,
        //% block="vertical"
        vertical
    }

    /**
     * Select direction for drawing lines
     */
    export enum FillSelection {
        //% block="not filled"
        notFilled,
        //% block="filled"
        filled
    }

    let font: Buffer;
    let cross: Buffer;


    const SSD1306_SETCONTRAST = 0x81
    const SSD1306_SETCOLUMNADRESS = 0x21
    const SSD1306_SETPAGEADRESS = 0x22
    const SSD1306_DISPLAYALLON_RESUME = 0xA4
    const SSD1306_DISPLAYALLON = 0xA5
    const SSD1306_NORMALDISPLAY = 0xA6
    const SSD1306_INVERTDISPLAY = 0xA7
    const SSD1306_DISPLAYOFF = 0xAE
    const SSD1306_DISPLAYON = 0xAF
    const SSD1306_SETDISPLAYOFFSET = 0xD3
    const SSD1306_SETCOMPINS = 0xDA
    const SSD1306_SETVCOMDETECT = 0xDB
    const SSD1306_SETDISPLAYCLOCKDIV = 0xD5
    const SSD1306_SETPRECHARGE = 0xD9
    const SSD1306_SETMULTIPLEX = 0xA8
    const SSD1306_SETLOWCOLUMN = 0x00
    const SSD1306_SETHIGHCOLUMN = 0x10
    const SSD1306_SETSTARTLINE = 0x40
    const SSD1306_MEMORYMODE = 0x20
    const SSD1306_COMSCANINC = 0xC0
    const SSD1306_COMSCANDEC = 0xC8
    const SSD1306_SEGREMAP = 0xA0
    const SSD1306_CHARGEPUMP = 0x8D
    const xOffset = 0
    const yOffset = 0
    let chipAdress = 0x3C
    let charX = 0
    let charY = 0
    let displayWidth = 128
    let displayHeight = 64 / 8
    let screenSize = 0
    //let font: Array<Array<number>>

    let fontZoom: number = 1;

    let screenBuf = pins.createBuffer(1025);

    function command(cmd: number) {
        let buf = pins.createBuffer(2)
        buf[0] = 0x00
        buf[1] = cmd
        pins.i2cWriteBuffer(chipAdress, buf, false)
    }

    //% block="set Font $zoom zoom"
    //% zoom.min=1 zoom.max=2
    //% zoom.defl=1
    //% weight=2
    //% group="Text"
    export function setFontZomm(zoom: number) {
        fontZoom = zoom
    }

    //% block="draw Buffer"
    //% weight=80
    //% group="Draw"
    export function drawBuff(x1: number=0, x2: number=127, page1: number=0, page2: number=7) {

        let pagex1 = x1 >> 4
        let pagex2 = x2 >> 4

        let bufferSize=16
        
        let line = pins.createBuffer(bufferSize+1)
        line[0] = 0x40

        for (let page = page1; page <= page2; page++) {

            command(SSD1306_SETCOLUMNADRESS)
            command(pagex1*16)
            command(pagex2*16+15)
            command(SSD1306_SETPAGEADRESS)
            command(page)
            command(page)


            let i = 1;
            for (let x = pagex1*16; x <= pagex2*16+15; x++) {

                let ind = x + page * 128 + 1
                line[i]  = screenBuf[ind]
                
                i++;
                if(i==bufferSize+1){
                    pins.i2cWriteBuffer(chipAdress, line)
                    i=1
                }

            }

        }
    }

    //% block="clear OLED display"
    //% weight=3
    //% group="Draw"
    export function clear() {
        command(SSD1306_SETCOLUMNADRESS)
        command(0x00)
        command(displayWidth - 1)
        command(SSD1306_SETPAGEADRESS)
        command(0x00)
        command(displayHeight - 1)
        let data = pins.createBuffer(17);
        data[0] = 0x40; // Data Mode
        for (let i = 1; i < 17; i++) {
            data[i] = 0x00
        }
        // send display buffer in 16 byte chunks
        for (let i = 0; i < screenSize; i += 16) {
            pins.i2cWriteBuffer(chipAdress, data, false)
        }
        for (let i=0;i<1025;i++){
            screenBuf[i]=0x00
        }
        charX = xOffset
        charY = yOffset
    }

    
    //% block="clear line $line"
    //% line.min=0 line.max=7
    //% weight=6
    //% group="Text"
    export function clearLine(line: number) {
        command(SSD1306_SETCOLUMNADRESS)
        command(0x00)
        command(displayWidth - 1)
        command(SSD1306_SETPAGEADRESS)
        command(line)
        command(line)
        let data = pins.createBuffer(17);
        data[0] = 0x40; // Data Mode
        for (let i = 1; i < 17; i++) {
            data[i] = 0x00
        }
        // send display buffer in 16 byte chunks
        for (let i = 0; i < displayWidth; i += 16) {
            pins.i2cWriteBuffer(chipAdress, data, false)
        }

        for (let x = 0; x < displayWidth; x++ ) {
            let ind = x + line * 128 + 1
            screenBuf[ind] = 0x00
        }

        charX = xOffset
        charY = yOffset
    }
    //% block="show string $str at $line"
    //% line.min=0 line.max=7
    //% weight=6
    //% group="Text"
    export function writeStringAtLine(str: string, line: number) {
        charX = 0;
        charY = line;
        for (let i = 0; i < str.length; i++) {
            if (charX > displayWidth - 6) {
                newLine()
            }
            drawChar(charX, charY, str.charAt(i))
            if(fontZoom==1)
                charX += 6
            else
                charX += 12
        }
    }
    //% block="show number $n at $line"
    //% line.min=0 line.max=7
    //% weight=5
    //% group="Text"
    export function writeNumAtLine(n: number, line: number) {
        let numString = n.toString()
        writeStringAtLine(numString, line)
    }

    //% block="show (without newline) string $str"
    //% weight=6
    //% group="Text"
    export function writeString(str: string) {
        for (let i = 0; i < str.length; i++) {
            if (charX > displayWidth - 6) {
                newLine()
            }
            drawChar(charX, charY, str.charAt(i))
            if(fontZoom==1)
                charX += 6
            else
                charX += 12
        }
    }
    //% block="show (without newline) number $n"
    //% weight=5
    //% group="Text"
    export function writeNum(n: number) {
        let numString = n.toString()
        writeString(numString)
    }
    //% block="show string $str"
    //% weight=8
    //% group="Text"
    export function writeStringNewLine(str: string) {
        writeString(str)
        newLine()
    }
    //% block="show number $n"
    //% weight=7
    //% group="Text"
    export function writeNumNewLine(n: number) {
        writeNum(n)
        newLine()
    }
    //% block="insert newline"
    //% weight=4
    //% group="Text"
    export function newLine() {
        charY++
        if(fontZoom!=1)
            charY++
        charX = xOffset
    }
    function drawChar(x: number, y: number, c: string) {

        command(SSD1306_SETCOLUMNADRESS)
        command(x)
        if(fontZoom==1)
            command(x + 5)
        else
            command(x + 5 + 6)
        command(SSD1306_SETPAGEADRESS)
        command(y)
        command(y)
        let line = pins.createBuffer(2)
        line[0] = 0x40
        for (let i = 0; i < 6; i++) {
            if (i === 5) {
                line[1] = 0x00
            } else {
                let charIndex = c.charCodeAt(0)
                let charNumber = font.getNumber(NumberFormat.UInt8BE, 5 * charIndex + i)

                if(fontZoom!=1){
                    let result = 0;
                    for (let i = 7; i >=0 ; i--) { // 从高位到低位
                        const bit = (charNumber >> i) & 1; // 右移并与 1 进行按位与运算
    
                        result = (result << 2) | (bit << 1) | bit;
                    }
                    charNumber = result & 0xFF;
                }

                charNumber = charNumber & 0xFF;
                
                line[1] = charNumber
            }

            
            if(fontZoom==1){
                let ind = x + y * 128 + 1 + i
                screenBuf[ind] = line[1];
            }else{
                let ind = x + y * 128 + 1 + i*2
                screenBuf[ind] = line[1];
                screenBuf[ind+1] = line[1];
            }



            pins.i2cWriteBuffer(chipAdress, line, false)

            if(fontZoom!=1)
                pins.i2cWriteBuffer(chipAdress, line, false)
        }

        if(fontZoom!=1){
            y++;
            command(SSD1306_SETCOLUMNADRESS)
            command(x)
            if(fontZoom==1)
                command(x + 5)
            else
                command(x + 5 + 6)
            command(SSD1306_SETPAGEADRESS)
            command(y)
            command(y)
            let line = pins.createBuffer(2)
            line[0] = 0x40
            for (let i = 0; i < 6; i++) {
                if (i === 5) {
                    line[1] = 0x00
                } else {
                    let charIndex = c.charCodeAt(0)
                    let charNumber = font.getNumber(NumberFormat.UInt8BE, 5 * charIndex + i)

                    if(fontZoom!=1){
                        let result = 0;
                        for (let i = 7; i >=0 ; i--) { // 从高位到低位
                            const bit = (charNumber >> i) & 1; // 右移并与 1 进行按位与运算
        
                            result = (result << 2) | (bit << 1) | bit;
                        }
                        charNumber = result >> 8;
                    }

                    charNumber = charNumber & 0xFF;

                    line[1] = charNumber

                }


                if(fontZoom==1){
                    let ind = x + y * 128 + 1 + i
                    screenBuf[ind] = line[1];
                }else{
                    let ind = x + y * 128 + 1 + i*2
                    screenBuf[ind] = line[1];
                    screenBuf[ind+1] = line[1];
                }

                pins.i2cWriteBuffer(chipAdress, line, false)

                if(fontZoom!=1)
                    pins.i2cWriteBuffer(chipAdress, line, false)
            }
        }

    }
    function drawShape(pixels: Array<Array<number>>, clear:boolean = false, drawNow:boolean=true) {

        for (let i = 0; i < pixels.length; i++) {
            let y = pixels[i][1];
            let x = pixels[i][0];

            let page = y >> 3
            let ind = x + page * 128 + 1
            let shift_page = y % 8
            let screenPixel = (screenBuf[ind] | (1 << shift_page))
            if(clear){
                screenPixel = (screenPixel ^ (1 << shift_page))
            }
            screenBuf[ind] = screenPixel
        }

        if(drawNow)
            drawBuff()

    }

    //% block="draw a cross starting at x %x|y %y"
    //% weight=72 blockGap=8
    //% group="Draw"
    //% x.min=0, x.max=127
    //% y.min=0, y.max=7
    //% inlineInputMode=inline
    export function drawCross(x: number, y: number) {

        command(SSD1306_SETCOLUMNADRESS)
        command(x)
        command(x + 47)
        command(SSD1306_SETPAGEADRESS)
        command(y)
        command(y + 5)
        let line = pins.createBuffer(17)
        line[0] = 0x40

        let int = 1;
        for(let i=0; i< 48*6;i++){
            
            let charNumber = cross.getNumber(NumberFormat.UInt8BE, i)
            charNumber = charNumber & 0xFF;
            line[int] = charNumber
            let ind = x+(i % 48) + (y+Math.floor(i/48)) * 128 + 1
            screenBuf[ind] = charNumber;
            int++;
            if(int==17){
                int=1
                pins.i2cWriteBuffer(chipAdress, line, false)
            }
        }


    }

    //% block="draw %im on X $x Y $y"
    //% x.min=0 x.max=127
    //% y.min=0 y.max=63
    //% weight=6
    //% group="Draw"
    export function drawImageOnXY(im:Image, x: number, y: number) {

        for (let dx = 0; dx < im.width(); dx++) {
            for (let dy = 0; dy < im.height(); dy++) {
                let fx = x+dx;
                let fy = y+dy;

                let page = fy >> 3
                let ind = fx + page * 128 + 1
                let shift_page = fy % 8
                let screenPixel = screenBuf[ind]

                screenPixel = screenPixel | (1 << shift_page)
                if ((im.pixel(dx, dy) ? 1 : 0)==0) {
                    screenPixel = (screenPixel ^ (1 << shift_page))
                }
                screenBuf[ind] = screenPixel
            }
        }
        //drawBuff()

    }

    //% block="draw16x16"
    //% weight=6
    //% imageLiteral=1
    //% imageLiteralColumns=16
    //% imageLiteralRows=16
    //% shim=images::createImage
    //% group="Draw"
    export function draw16x16(i: String): Image {
        const im = <Image><any>i;
        return im;
    }

    //% block="draw8x8"
    //% weight=6
    //% imageLiteral=1
    //% imageLiteralColumns=8
    //% imageLiteralRows=8
    //% shim=images::createImage
    //% group="Draw"
    export function draw8x8(i: String): Image {
        const im = <Image><any>i;
        return im;
    }

    /**
     * Draw a line of a specific length in pixels, using the (x, y) coordinates as a starting point.
     * @param lineDirection is the selection of either horizontal line or vertical line
     * @param x is start position on the X axis, eg: 0
     * @param y is start position on the Y axis, eg: 0
     * @param len is the length of line, length is the number of pixels, eg: 10
     */
    //% block="draw a %lineDirection | line with length of %len starting at x %x|y %y,  clear: %clear"
    //% weight=72 blockGap=8
    //% group="Draw"
    //% x.min=0, x.max=127
    //% y.min=0, y.max=63
    //% len.min=-128, len.max=128
    //% clear.defl=false
    //% inlineInputMode=inline
    export function drawLine(lineDirection: LineDirectionSelection, len: number, x: number, y: number, clear:boolean = false, drawNow:boolean=true) {

        let pixels: Array<Array<number>> = []

        if (x < 0)
            x = 0

        if (x > 127)
            x = 127

        if (y < 0)
            y = 0

        if (y > 63)
            y = 63

        if (lineDirection == LineDirectionSelection.horizontal) {

            if (len > 128) //check line length is not greater than screen length
                len = 128       //if so, set to screen length max

            else if (len < 0) {  //check if the line is a negative number

                if (len < -128)   //limit to maximum screen length as a negative number
                    len = -128      //set max negative line limit horizontal

                len = Math.abs(len) //take absolute of the number for the length
                x = x - len         //move the X point to the start of the line as drawing left to riight

                if (x < 0) {         //check if X is now a negative number

                    len = len + x   //if so then length calulated to 0 point
                    x = 0           //x is now 0
                }
            }

            if ((x + len) > 128)     //check that the length of line from the X start point does not exceed the screen limits
                len = 128 - x       //if so adjust length to the length from X to the end of screen
            
            for (let hPixel = x; hPixel < (x + len); hPixel++){      // Loop to set the pixels in the horizontal line
                pixels.push([hPixel, y]);
            }
        } else if (lineDirection == LineDirectionSelection.vertical) {

            if (len > 64)          // check for max vertical length
                len = 64            //if so, set to screen height max
            
            else if (len < 0) {     //check if the line is a negative number

                if (len < -64)    //limit to maximum screen length as a negative number
                    len = -64       //set max negative line limit vertically
                
                len = Math.abs(len) //take absolute value of length and adjust the y value
                y = y - len         //move the Y point to the start of the line as drawing left to riight
                
                if (y < 0) {    //check the y has not gone below 0

                    len = len + y   //if so then length calulated to 0 point
                    y = 0           //y is now 0
                }
            }

            if ((y + len) > 64)   //check that the length of line from the Y start point does not exceed the screen limits
                len = 64 - y        //if so adjust length to the length from X to the end of screen
            
            for (let vPixel = y; vPixel < (y + len); vPixel++){      // Loop to set the pixels in the vertical line
                pixels.push([x, vPixel]);
            }
        }

        drawShape(pixels, clear, drawNow)
    }

    /**
     * Draw a rectangle with a specific width and height in pixels, using the (x, y) coordinates as a starting point.
     * @param filled is the selection of either filled or not
     * @param width is width of the rectangle, eg: 60
     * @param height is height of the rectangle, eg: 30
     * @param x is the start position on the X axis, eg: 0
     * @param y is the start position on the Y axis, eg: 0
     */
    //% block="draw a %filled rectangle %width|width %height|height from position x %x|y %y,  clear: %clear"
    //% weight=71 blockGap=8
    //% group="Draw"
    //% width.min=1 width.max=128
    //% height.min=1 height.max=64
    //% x.min=0 x.max=127
    //% y.min=0 y.max=63
    //% clear.defl=false
    //% inlineInputMode=inline
    export function drawRect(filled: FillSelection, width: number, height: number, x: number, y: number, clear:boolean = false, drawNow:boolean=true) {

        if (!x)    // If variable 'x' has not been used, default to x position of 0
            x = 0

        if (!y)    // If variable 'y' has not been used, default to y position of 0
            y = 0

        // Draw the lines for each side of the rectangle
        if(filled==FillSelection.filled){
            let pixels: Array<Array<number>> = []
            for(let dy = y; dy<=y+height-1; dy++){
                for(let dx = x; dx<=x+width-1; dx++){
                    pixels.push([dx,dy]);
                    if(pixels.length>128){
                        drawShape(pixels, clear, false)
                        pixels = [];
                    }
                }
            }
            if(pixels.length>0)
                drawShape(pixels, clear, false)

        }else{
            drawLine(LineDirectionSelection.horizontal, width, x, y, clear, false)
            drawLine(LineDirectionSelection.horizontal, width, x, y + height-1, clear, false)
            drawLine(LineDirectionSelection.vertical, height, x, y, clear, false)
            drawLine(LineDirectionSelection.vertical, height, x + width-1, y, clear, false)
           
        }

        if(drawNow)
            drawBuff(x,x+width-1,y >> 3, (y+height-1) >> 3)
        
    }

    //% block="draw %filled circle at x: $x y: $y radius: $r,  clear: %clear"
    //% x.defl=64
    //% y.defl=32
    //% r.defl=10
    //% weight=0
    //% clear.defl=false
    //% group="Draw"
    //% inlineInputMode=inline
    export function drawCircle(filled: FillSelection, x: number, y: number, r: number, clear:boolean = false) {
        if(filled==FillSelection.filled){
            for (let dx = -r; dx <= r; dx++) {
                let height = Math.floor(Math.sqrt(r * r - dx * dx));
                drawLine(LineDirectionSelection.vertical, height*2, x + dx, y-height, clear, false)
            }
        }else{
            let pixels: Array<Array<number>> = []

            let theta = 0;
            let step = Math.PI / 90;  // Adjust step for smoothness
    
            while (theta < 2 * Math.PI) {
                let xPos = Math.floor(x + r * Math.cos(theta));
                let yPos = Math.floor(y + r * Math.sin(theta));
                pixels.push([xPos, yPos]);
                if(pixels.length>128){
                    drawShape(pixels, clear, false)
                    pixels = [];
                }
                theta += step;
            }
            drawShape(pixels, clear, false)
        }
        
        drawBuff()
    }
    
    //% block="initialize OLED with width $width height $height address $address"
    //% width.defl=128
    //% height.defl=64
    //% address.defl=60
    //% weight=9
    export function init(width: number, height: number, address:number=60) {
        chipAdress = address
        command(SSD1306_DISPLAYOFF);
        command(SSD1306_SETDISPLAYCLOCKDIV);
        command(0x80);                                  // the suggested ratio 0x80
        command(SSD1306_SETMULTIPLEX);
        command(0x3F);
        command(SSD1306_SETDISPLAYOFFSET);
        command(0x0);                                   // no offset
        command(SSD1306_SETSTARTLINE | 0x0);            // line #0
        command(SSD1306_CHARGEPUMP);
        command(0x14);
        command(SSD1306_MEMORYMODE);
        command(0x00);                                  // 0x0 act like ks0108
        command(SSD1306_SEGREMAP | 0x1);
        command(SSD1306_COMSCANDEC);
        command(SSD1306_SETCOMPINS);
        command(0x12);
        command(SSD1306_SETCONTRAST);
        command(0xCF);
        command(SSD1306_SETPRECHARGE);
        command(0xF1);
        command(SSD1306_SETVCOMDETECT);
        command(0x40);
        command(SSD1306_DISPLAYALLON_RESUME);
        command(SSD1306_NORMALDISPLAY);
        command(SSD1306_DISPLAYON);
        displayWidth = width
        displayHeight = height / 8
        screenSize = displayWidth * displayHeight
        charX = xOffset
        charY = yOffset
        cross = hex`0C1E3F7FFEFCF8F0E0C080000000000000000000000000000000000000000000000000000080C0E0F0F8FCFE7F3F1E0C00000000000103070F1F3F7FFEFCF8F0E0C0800000000000000000000080C0E0F0F8FCFE7F3F1F0F0703010000000000000000000000000000000000000103070F1F3F7FFEFCF8F0F0F8FCFE7F3F1F0F070301000000000000000000000000000000000000000000000000000080C0E0F0F8FCFE7F3F1F0F0F1F3F7FFEFCF8F0E0C08000000000000000000000000000000000000080C0E0F0F8FCFE7F3F1F0F070301000000000000000000000103070F1F3F7FFEFCF8F0E0C08000000000003078FCFE7F3F1F0F07030100000000000000000000000000000000000000000000000000000103070F1F3F7FFEFC7830`
        font = hex`
    0000000000
    3E5B4F5B3E
    3E6B4F6B3E
    1C3E7C3E1C
    183C7E3C18
    1C577D571C
    1C5E7F5E1C
    00183C1800
    FFE7C3E7FF
    0018241800
    FFE7DBE7FF
    30483A060E
    2629792926
    407F050507
    407F05253F
    5A3CE73C5A
    7F3E1C1C08
    081C1C3E7F
    14227F2214
    5F5F005F5F
    06097F017F
    006689956A
    6060606060
    94A2FFA294
    08047E0408
    10207E2010
    08082A1C08
    081C2A0808
    1E10101010
    0C1E0C1E0C
    30383E3830
    060E3E0E06
    0000000000
    00005F0000
    0007000700
    147F147F14
    242A7F2A12
    2313086462
    3649562050
    0008070300
    001C224100
    0041221C00
    2A1C7F1C2A
    08083E0808
    0080703000
    0808080808
    0000606000
    2010080402
    3E5149453E
    00427F4000
    7249494946
    2141494D33
    1814127F10
    2745454539
    3C4A494931
    4121110907
    3649494936
    464949291E
    0000140000
    0040340000
    0008142241
    1414141414
    0041221408
    0201590906
    3E415D594E
    7C1211127C
    7F49494936
    3E41414122
    7F4141413E
    7F49494941
    7F09090901
    3E41415173
    7F0808087F
    00417F4100
    2040413F01
    7F08142241
    7F40404040
    7F021C027F
    7F0408107F
    3E4141413E
    7F09090906
    3E4151215E
    7F09192946
    2649494932
    03017F0103
    3F4040403F
    1F2040201F
    3F4038403F
    6314081463
    0304780403
    6159494D43
    007F414141
    0204081020
    004141417F
    0402010204
    4040404040
    0003070800
    2054547840
    7F28444438
    3844444428
    384444287F
    3854545418
    00087E0902
    18A4A49C78
    7F08040478
    00447D4000
    2040403D00
    7F10284400
    00417F4000
    7C04780478
    7C08040478
    3844444438
    FC18242418
    18242418FC
    7C08040408
    4854545424
    04043F4424
    3C4040207C
    1C2040201C
    3C4030403C
    4428102844
    4C9090907C
    4464544C44
    0008364100
    0000770000
    0041360800
    0201020402
    3C2623263C
    1EA1A16112
    3A4040207A
    3854545559
    2155557941
    2154547841
    2155547840
    2054557940
    0C1E527212
    3955555559
    3954545459
    3955545458
    0000457C41
    0002457D42
    0001457C40
    F0292429F0
    F0282528F0
    7C54554500
    2054547C54
    7C0A097F49
    3249494932
    3248484832
    324A484830
    3A4141217A
    3A42402078
    009DA0A07D
    3944444439
    3D4040403D
    3C24FF2424
    487E494366
    2B2FFC2F2B
    FF0929F620
    C0887E0903
    2054547941
    0000447D41
    3048484A32
    384040227A
    007A0A0A72
    7D0D19317D
    2629292F28
    2629292926
    30484D4020
    3808080808
    0808080838
    2F10C8ACBA
    2F102834FA
    00007B0000
    08142A1422
    22142A1408
    AA005500AA
    AA55AA55AA
    000000FF00
    101010FF00
    141414FF00
    1010FF00FF
    1010F010F0
    141414FC00
    1414F700FF
    0000FF00FF
    1414F404FC
    141417101F
    10101F101F
    1414141F00
    101010F000
    0000001F10
    1010101F10
    101010F010
    000000FF10
    1010101010
    101010FF10
    000000FF14
    0000FF00FF
    00001F1017
    0000FC04F4
    1414171017
    1414F404F4
    0000FF00F7
    1414141414
    1414F700F7
    1414141714
    10101F101F
    141414F414
    1010F010F0
    00001F101F
    0000001F14
    000000FC14
    0000F010F0
    1010FF10FF
    141414FF14
    1010101F00
    000000F010
    FFFFFFFFFF
    F0F0F0F0F0
    FFFFFF0000
    000000FFFF
    0F0F0F0F0F
    3844443844
    7C2A2A3E14
    7E02020606
    027E027E02
    6355494163
    3844443C04
    407E201E20
    06027E0202
    99A5E7A599
    1C2A492A1C
    4C7201724C
    304A4D4D30
    3048784830
    BC625A463D
    3E49494900
    7E0101017E
    2A2A2A2A2A
    44445F4444
    40514A4440
    40444A5140
    0000FF0103
    E080FF0000
    08086B6B08
    3612362436
    060F090F06
    0000181800
    0000101000
    3040FF0101
    001F01011E
    00191D1712
    003C3C3C3C
    0000000000`
        clear()
    }
} 
