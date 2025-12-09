import '../styles/about.css';

export default function About(){
    return(
        <div className='ap-content'>
            <div className='about'>
                <div className='about-content'>
                    <p className='about-title'>About</p>
                    <img className='circle-top' src='photos/ap_circle_top.png'></img>
                    <img className='triangle-top' src='photos/ap_triangle_top.png'></img>
                    <div className='about-text'>
                        <p className='about-p'>
                            GraphaRNA is an easy-to-use web application for generating 3D RNA structures from sequence 
                            and secondary structure input. Powered by graph neural networks and diffusion modeling, 
                            it learns interatomic interactions and predicts realistic RNA conformations with atomic-level 
                            detail.
                        </p>
                        <p className='about-p'>
                            Designed for flexibility and exploration, GraphaRNA allows users to model small RNA 
                            motifs, test structural hypotheses, and examine alternative base-pairing scenarios -- all 
                            through a fast and intuitive interface, without installing any software.
                        </p>
                        <p className='about-p'>
                            The source code of 
                            the GraphaRNA computational engine is available on <a href="https://github.com/mjustynaPhD/GraphaRNA" className="about-link">GitHub</a>, 
                            and the training/test datasets together with pre-trained model weights are provided on <a href="https://zenodo.org/records/13750967" className="about-link"> Zenodo</a>.
                        </p>
                    </div>
                </div>
            </div>
            <div className='authors'>
                <div className='authors-content'>
                    <p className='authors-title'>Authors</p>
                    <img className='triangle-mid' src='photos/ap_triangle_mid.png'></img>
                    <img className='circle-mid' src='photos/ap_circle_mid.png'></img>
                    <div className='author-groups'>
                        <div className='authors-profs'>
                            <div className='authors-circle'>
                                <img className='rocket-icon' src='icons/rocket.svg'></img>
                            </div>
                            <p className='graphaRNA-text'>GraphaRNA</p>
                            <div className='authors-rectangle'>
                                <div className='authors-row'>
                                    <div className='author'>
                                        <img src='icons/person.svg'></img>
                                        <p className='name'>Marek Justyna</p>
                                    </div>
                                    <div className='author'>
                                        <img src='icons/person.svg'></img>
                                        <p className='name'>Craig Zirbel</p>
                                    </div>
                                    <div className='author'>
                                        <img src='icons/person.svg'></img>
                                        <p className='name'>Maciej Antczak</p>
                                    </div>
                                </div>
                                <div className='authors-row'>
                                    <div className='author'>
                                        <img src='icons/person.svg'></img>
                                        <p className='name'>Marta Szachniuk</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='authors-students'>
                            <div className='authors-circle1'>
                                <img className='web-icon' src='icons/web.svg'></img>
                            </div>
                            <p className='graphaRNAweb-text'>Grapha
                                <span className='rna'>RNA</span>
                                <span className='web'>-web</span>
                            </p>
                            <div className='authors-rectangle1'>
                                <div className='authors-row'>
                                    <div className='author'>
                                        <img src='icons/person.svg'></img>
                                        <p className='name'>Aleksandra Górska</p>
                                    </div>
                                    <div className='author'>
                                        <img src='icons/person.svg'></img>
                                        <p className='name'>Katarzyna Róg</p>
                                    </div>
                                    <div className='author'>
                                        <img src='icons/person.svg'></img>
                                        <p className='name'>Filip Urbański</p>
                                    </div>
                                </div>
                                <div className='authors-row'>
                                    <div className='author'>
                                        <img src='icons/person.svg'></img>
                                        <p className='name'>Tymoteusz Pawłowski</p>
                                    </div>
                                    <div className='author'>
                                        <img src='icons/person.svg'></img>
                                        <p className='name'>Bartosz Skrzypczak</p>
                                    </div>
                                    <div className='author'>
                                        <img src='icons/person.svg'></img>
                                        <p className='name'>Paweł Kelar</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className='funds'>
                <div className='funds-content'>
                    <p className='funds-title'>Acknowledgements and Funding</p>
                    <p className='funds-text'>
                        This project was supported by the National Science Centre, Poland 
                        (grants 2020/39/O/ST6/01488 and 2023/51/D/ST6/01207), and by the statutory funds 
                        of Poznan University of Technology.
                    </p>
                    <img className='triangle-bottom' src='photos/ap_triangle_bot.png'></img>
                </div>
            </div>
        </div>
    )
}