import '../styles/cite.css';

export default function CiteUs(){
    return(
        <div className='content'>
            <div className='cite'>
                <p className='cite-title'>Cite us</p>
                <div className='cite-content'>
                    <p className='cite-subtitle'>Any published work which has made use of GraphaRNA should cite the following paper:</p>
                    <img className='circle' src='photos/cp_circle.png'></img>
                    <img className='triangle' src='photos/cp_triangle.png'></img>
                    <img className='green-thing' src='icons/cp_thing.svg'></img>
                    <div className='text'>
                        <p className='para'>Justyna M, Zirbel CL, Antczak M, Szachniuk M (2025), Graph Neural Network and Diffusion Model for modeling RNA interatomic interactions, submitted</p>
                    </div>
                </div>
            </div>
        </div>
    )
}