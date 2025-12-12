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
                        <p className='about-p1'>
                            GraphARNA-Web is an interactive platform for RNA 3D structure exploration powered by generative graph neural networks. 
                            Our method represents RNA molecules as graphs, capturing both nucleotide sequence information and complex 2D structural interactions. Instead of predicting full atomic models directly, GraphARNA-Web focuses on RNA 3D descriptors—local structural motifs that reflect how small groups of nucleotides arrange in space.
                        </p>
                        <p className='about-p2'>
                            By learning a distribution of these descriptors from experimentally determined RNA structures, the model composes them into coherent 3D conformations that respect user-defined secondary-structure constraints. 
                            The result is a fast, intuitive tool that helps users visualize, compare, and analyze possible RNA folds. 
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
                        This research was supported by grants 2020/39/O/ST6/01488, 2023/51/D/ST6/01207 from the National Science Centre, Poland.
                    </p>
                    <img className='triangle-bottom' src='photos/ap_triangle_bot.png'></img>
                </div>
            </div>
        </div>
    )
}