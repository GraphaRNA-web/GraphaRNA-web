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
                    <div className='cite-text'>
                        <p className='cite-para'>
                            Marek Justyna, Craig Zirbel, Maciej Antczak, Marta Szachniuk, Graph neural network and diffusion model for modeling RNA interatomic interactions, <em>Bioinformatics</em>, Volume 41, Issue 9, September 2025, btaf515,{' '}
                            <a 
                                href="https://doi.org/10.1093/bioinformatics/btaf515" 
                                target="_blank" 
                                rel="noopener noreferrer"
                            >
                                https://doi.org/10.1093/bioinformatics/btaf515
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}