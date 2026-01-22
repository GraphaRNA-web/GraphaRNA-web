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
                            GraphaRNA is an interactive platform for RNA 3D structure exploration powered by generative graph neural networks. 
                            Our method represents RNA molecules as graphs, capturing both nucleotide sequence information and complex 2D structural interactions. Instead of predicting full atomic models directly, GraphaRNA focuses on RNA 3D descriptors — local structural motifs that reflect how small groups of nucleotides arrange in space.
                        </p>
                        <p className='about-p2'>
                            By learning a distribution of these descriptors from experimentally determined RNA structures, the model composes them into coherent 3D conformations that respect user-defined secondary-structure constraints. 
                            The result is a fast, intuitive tool that helps users visualize, compare, and analyze possible RNA folds. 
                        </p>
                        <p className='about-p3'>
                            Designed for flexibility and exploration, GraphaRNA allows users to model small RNA motifs, test structural hypotheses, and examine alternative base-pairing scenarios - all through a fast and intuitive interface, without installing any software.
                        </p>
                        <p className='about-p4'>
                            The source code of the GraphaRNA computational engine is available on <a className="about-link" href="https://github.com/mjustynaPhD/GraphaRNA">GitHub</a>, and the training/test datasets together with pre-trained model weights are provided on <a className="about-link" href="https://zenodo.org/records/13750967">Zenodo</a>.
                        </p>
                    </div>
                </div>
            </div>
            <div className='authors'>
                <div className='authors-content'>
                    <p className='authors-title'>Authors and Contributors</p>
                    <div className='concept-and-engine'>
                        <p className='authors-names'>Concept and engine</p>
                        <p className='authors-names'>Marek Justyna, Maciej Antczak, Marta Szachniuk</p>
                    </div>
                    <div className='gui-design'>
                        <p className='authors-names'>GUI design</p>
                        <p className='authors-names'>Aleksandra Górska, Katarzyna Róg, Marek Justyna, Maciej Antczak, Marta Szachniuk</p>
                    </div>
                    <div className='web-implementation'>
                        <p className='authors-names'>Web implementation</p>
                        <p className='authors-names'>Paweł Kelar, Tymoteusz Pawłowski, Bartosz Skrzypczak, Filip Urbański</p>
                    </div>
                    <img className='circle-mid' src='photos/ap_circle_mid.png'></img>
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
