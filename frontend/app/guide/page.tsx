import '../styles/guide.css';
import '../styles/globals.css';
export default function Guide() {
  return (
    <div className="guide-page">
        <div className="gp-content">
            <h1 className="header-title">How to submit a job</h1>
            <ol>
                <li className="header-step">Step 1: Prepare your input
                    <p className="text-standard">
                        You can input RNA data in three formats: Interactive, Text, or File (.fasta).  
                    </p>
                    <ul className="text-list">
                        <li>Interactive: Enter your RNA sequence and secondary structure strand by strand. Press the plus button to enter another strand.
                            <img src="/interactive_example.png" alt="Interactive Example" className="example-image"/>
                        </li>
                        <li>Text: Paste your RNA sequence and secondary structure into the text area.
                            <img src="/text_example.png" alt="Text Example" className="example-image"/>

                        </li>
                        <li>File (.fasta): Upload a .fasta file containing your RNA sequence and secondary structure.
                            <img src="/file_example.png" alt="File Example" className="example-image"/>
                        </li>

                    </ul>
                    <p className="text-standard">
                        After pressing the "Next" button, the system will validate your input. If there are any issues, you will receive corrected
                        input if possible, or else a message indicating the issue.
                    </p>
                </li>
                <li className="header-step">Step 2: Enter job parameters
                    <p className="text-standard">
                        After your input is validated, you can enter parameters such as job name, seed (integer used for seeding the prediction algorithm),
                        and number of alternative conformations (predictions of the original input with different seeds). Job name and seed can be generated automatically.
                    </p>
                    <img src="/form-step-2.png" alt="Step 2 Example" className="example-image"/>
                </li>
                <li className="header-step">Step 3: Enter your email (optional)
                    <p className="text-standard">
                        You can enter your email address to receive a notification when your job is complete and a reminder when it is about to expire. This is optional.
                    </p>
                    <img src="/email-example.png" alt="Step 3 Example" className="example-image"/>
                </li>
                <li className="header-step">Step 4: View your job page
                    <p className="text-standard">
                        After submitting your job, you will be redirected to the job page. 
                        Here you can monitor the status of your job and view results once it is complete. 
                        If you provided an email, a link to the job page will be sent to your inbox, and you will receive a notification when the job is complete.
                        Job expires two weeks after completion, and you will receive a reminder email a day before expiration.
                    </p>
                </li>
            </ol>
            


        </div>
    </div>
  );
}
