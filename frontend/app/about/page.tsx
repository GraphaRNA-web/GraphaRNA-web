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
                            Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor.
                            Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.
                            Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim.
                            Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut,
                            imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt.
                            Cras dapibus. Vivamus elementum semper nisi. 
                        </p>
                        <p className='about-p2'>
                            Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim.
                            Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus. Phasellus viverra nulla ut metus 
                            varius laoreet. Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur 
                            ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus. Maecenas tempus, tellus eget condimentum 
                            rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum. Nam quam nunc, blandit vel,
                            luctus pulvinar, hendrerit id, lorem. 
                        </p>
                        <p className='about-p3'>
                            Vestibulum purus quam, scelerisque ut, mollis sed, nonummy id, metus. Nullam accumsan lorem in dui. 
                            Cras ultricies mi eu turpis hendrerit fringilla. Vestibulum ante ipsum primis in faucibus orci luctus 
                            et ultrices posuere cubilia Curae; In ac dui quis mi consectetuer lacinia. Nam pretium turpis et arcu.
                            Duis arcu tortor, suscipit eget, imperdiet nec, imperdiet iaculis, ipsum. Sed aliquam ultrices mauris.
                            Integer ante arcu, accumsan a, consectetuer eget, posuere ut, mauris. Praesent adipiscing. 
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