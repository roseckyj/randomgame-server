import React from "react";
import io from "socket.io-client";

interface IAppProps {}

interface IAppState { }

class App extends React.Component<IAppProps, IAppState> {
    gameCanvas = React.createRef<HTMLCanvasElement>();
    context: CanvasRenderingContext2D | null = null;
    socket: SocketIOClient.Socket;

    constructor(props: IAppProps) {
        super(props);
        this.socket = io("http://localhost:3001");
    }

    componentDidMount() {
        if (this.gameCanvas.current) {
            const a = this.gameCanvas.current.getContext("2d");
            this.context = a;
        }
        this.socket.on("position", (data: {x: number, y: number}) => {
            if (this.context && this.gameCanvas.current) {
                this.context.clearRect(0, 0, this.gameCanvas.current.width, this.gameCanvas.current.height);
                this.context.fillRect(data.x, data.y, 20, 20);
            }
        });
    }

    move(direction: "up" | "down" | "left" | "right") {
        console.log(direction);
        this.socket.emit("move", direction);
    }

    render() {
        return (
            <>
                <canvas
                    id="game"
                    width="640"
                    height="480"
                    style={{ border: "1px solid black" }}
                    ref={this.gameCanvas}
                ></canvas>
                <p>
                    <button onClick={() => this.move("right")}>Right</button>
                    <button onClick={() => this.move("left")}>Left</button>
                    <button onClick={() => this.move("up")}>Up</button>
                    <button onClick={() => this.move("down")}>Down</button>
                </p>
            </>
        );
    }
}

export default App;
