import '../styles/guide.css';
import '../styles/globals.css';
export default function Guide() {
  return (
    <div className="guide-page">
        <div className="gp-content">

            <div className="guide-toc">
                <h2 className="header-guide-toc-title">Guide Page content</h2>
                <ol className="guide-toc-list">
                    <li className="text-standard-toc">1. <a href="#submit-job">How to submit a job.</a></li>
                    <li className="text-standard-toc">2. <a href="#view-job">View your job page.</a></li>
                    <li className="text-standard-toc">3. <a href="#jobs-queue">See the jobs queue.</a></li>
                </ol>
            </div>

            <div className='gp-step1'>
                <h1 className="gp-header-title" id="submit-job">1. How to submit a job</h1>
                <div className='gp-step-content'>
                    <div className="gp-step">
                        <h2 className="header-step"><i>Step 1:</i> Prepare your input</h2>
                        <div className='gp-step-step-content'>
                            <p className="text-standard"> You can input RNA data in three formats: </p>

                            <ul className="step-list-dot text-standard">
                            <li>Interactive</li>
                            <li>Text</li>
                                <li>File (.fasta)</li>
                            </ul>

                            <p className="text-standard">First comes the <span className="bold">interactive form.</span></p>
                            <img src="/photos/interactive_selected.png" alt="Interactive Selected" className="example-image" />

                            <p className="text-standard">
                                In order to proceed with the job, enter your RNA sequence and secondary structure strand by strand.
                                Press the plus button to enter another strand.
                            </p>
                            <img src="/photos/interactive_example.png" alt="Interactive Example" className="example-image" />

                            <p className="text-standard">
                                Next, there is a <span className="bold">textual format.</span></p>
                            <img src="/photos/text_selected.png" alt="Text Selected" className="example-image" />

                            <p className="text-standard">
                                Paste your RNA sequence and secondary structure into the text area.
                            </p>
                            <img src="/photos/text_example.png" alt="Text Example" className="example-image" />

                            <p className="text-standard">
                                Last but not least – RNA structure in a form of a <span className="bold">file.</span>
                            </p>
                            <img src="/photos/file_selected.png" alt="File Selected" className="example-image" />
                            
                            <p className="text-standard">
                                Upload a <span className="bold">.fasta</span> file containing your RNA sequence and secondary structure.
                            </p>
                            <img src="/photos/file_example.png" alt="File Example" className="example-image" />

                            <p className="text-standard">
                                After pressing the <span className="bold">"Next"</span> button, the system will validate and process your input.
                                If there are any issues, you will receive corrected input if possible, or a message indicating the problem.
                                In case you would like to validate your input <span className="bold">without running a job</span>,
                                we also provide a <span className="bold">"Validate structure"</span> button.
                            </p>
                            <img src="/photos/next_example.png" alt="Next Example" className="example-image" id="next-example" />
                        </div>
                    </div>

                    <div className="gp-step">
                        <h2 className="header-step"><i>Step 2:</i> Enter job parameters</h2>                           
                        <p className="text-standard">
                            After your input is validated, you can enter parameters such as <span className="bold">job name</span>,
                            <span className="bold"> seed</span> (an integer used for seeding the prediction algorithm),
                            and number of <span className="bold">alternative conformations</span>
                            (predictions of the original input with different seeds).
                            Job name and seed can be generated automatically if needed.
                        </p>
                        <img src="/photos/form-step-2.png" alt="Step 2 Example" className="example-image" />
                    </div>

                    <div className="gp-step">
                       <h2 className="header-step"><i>Step 3:</i> Enter your email (optional)</h2>
                        <p className="text-standard">
                            You can enter your e-mail address to receive a notification when your job is complete.
                            You’ll get a URL to the job’s results page and a reminder before it expires.
                            This is optional — you can proceed without providing an e-mail.
                        </p>
                       <img src="/photos/email-example.png" alt="Step 3 Example" className="example-image" />
                    </div>
                </div>
            </div>

            <div className='gp-step2'>
                <h1 className="gp-header-title" id="view-job">2. View your job page</h1>
                <div className='gp-step-content'>
                    <p className="text-standard paragraph">After submitting a job, you will be redirected to the job’s results page. 
                        Here you can monitor the status of your job and view results once it’s complete. 
                        If you provided an email, a link to the job page will be sent to your inbox, and you will receive a notification when the job is complete. 
                        Job expires two weeks after completion, and you will receive a reminder email a day before expiration.
                    </p>
                    <img src="/photos/job_results_example.png" alt="Job Results Example" className="example-image"/>
                </div>
            </div>

            <div className='gp-step3'>
                <h1 className="gp-header-title" id="jobs-queue">3. See the jobs queue</h1>
                <div className='gp-step-content'>
                    <p className="text-standard paragraph">
                        While waiting for the job results you can check out the status of your job.
                        It is listed in the queue of jobs. All of the requests are queued and processed in the First In, First Out order. 
                    </p>
                    <p className="text-standard paragraph">
                        You can view the <span className="bold">active</span> and <span className="bold">finished jobs</span> with their statuses and all the details.
                    </p>
                    <img src="/photos/jobs_queue_example.png" alt="Jobs Queue Example" className="example-image"/>
                </div>
            </div>
        </div>
    </div>
  );
}
