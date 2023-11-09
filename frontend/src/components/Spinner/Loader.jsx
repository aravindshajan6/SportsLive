import { Spinner } from "react-bootstrap";


const Loader = () => {
  return (
        <Spinner id="loader"
        animation="grow"
        role="status"
        style={{
            width: "100px",
            height: "100px",
            margin: "auto",
            display: "none",
            marginTop: '20px',
        }}
        ></Spinner>
  )
}

export default Loader