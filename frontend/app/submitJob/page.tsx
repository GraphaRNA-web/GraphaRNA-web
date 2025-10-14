'use client';

import { useState } from 'react';
import { validateRNA, getSuggestedData, submitJobRequest } from "@/lib/api";
import Modal from '../components/Modal';
import Slider from '../components/Slider';
import '../styles/submitJob.css';
import Button from '../components/Button';
import StepsIndicator from '../components/StepsIndicator';
import TextArea from '../components/TextArea';
import CustomCheckbox from '../components/CustomCheckbox';
import IntegerField from '../components/IntegerField';
import MessageBox from '../components/MessageBox';


export default function SubmitJob() {
  const [inputFormat, setInputFormat] = useState("Text");
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [text, setText] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [approves, setApproves] = useState<string[]>([]);
  const [autoSeed, setAutoSeed] = useState(true);
  const [autoName, setAutoName] = useState(true);
  const [seed, setSeed] = useState(0);
  const [jobname, setJobname] = useState("");
  const [email, setEmail] = useState("");
  const [alternativeConformations, setAlternativeConformations] = useState(1);


  const allowedCharacters = /^[ACGUacgu(.)\s\n]*$/;

  const dynamicHeight = 500 + 50 * errors.length + 50 * warnings.length + 50 * approves.length

  const emailValidator = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const [structures, setStructures] = useState<string[]>([""]);

const validateStructures = (): boolean => {
  const newErrors: string[] = [];

  structures.forEach((s, idx) => {
    const trimmed = s.trim();
    if (trimmed === '') {
      newErrors.push(`Structure ${idx + 1} cannot be empty.`);
    } 
  });

  setErrors(newErrors);
  return newErrors.length === 0;
};


const handleStructureChange = (index: number, newValue: string) => {
  const updated = [...structures];
  updated[index] = newValue;
  setStructures(updated);
};

const addStructure = () => {
  setStructures([...structures, ""]);
};


const validateStructure = async (): Promise<boolean> => {
  if (inputFormat === "Text") {
    const trimmedText = text;
    console.log("[validateStructure] start", { inputFormat, text });

    // reset old communicates
    setErrors([]);
    setWarnings([]);
    setApproves([]);

    if (trimmedText === '') {
      setErrors(["Input cannot be empty."]);
      return false;
    }

    try {
      console.log("[validateStructure] calling validateRNA...");
      const result = await validateRNA(trimmedText);

      if (!result["Validation Result"]) {
        let errorList: string[] = ["Validation failed on server"];

        if (Array.isArray(result["Error List"]) && result["Error List"].length > 0) {
          const flatErrors = result["Error List"].flat();
          errorList = errorList.concat(flatErrors);
        }

        console.log("ErrorList: ", errorList);
        setErrors(errorList);
        return false;
      }

      // always set the input to be ready for the engine
      setText(result["Validated RNA"]);

      // jeśli backend zasugerował poprawkę → ustawiamy warning
      if (result["Fix Suggested"] && result["Validated RNA"]) {
          const warningsList: string[] = ["A fix was suggested by the server"];
          if (result["Incorrect Pairs"]?.length > 0) {
            const pairsMsg = result["Incorrect Pairs"]
              .map((pair: [number, number]) => `[${pair[0]} - ${pair[1]}]`)
              .join(", ");
            warningsList.push(`Incorrect Pairs: ${pairsMsg}`);
          }

          if (result["Mismatching Brackets"]?.length > 0) {
            const bracketMsg = result["Mismatching Brackets"]
              .map((pos: number) => pos.toString())
              .join(", ");
            warningsList.push(`Mismatching bracket at positions: ${bracketMsg}`);
          }
          setWarnings(warningsList);
        }

      // jeśli brak błędów i brak warningów → approve
      if (!result["Fix Suggested"]) {
        setApproves(["Validation passed successfully. Input was parsed to the engine's format."]);
      }

      return true;
    } catch (err: any) {
      setErrors([err.message || "Server validation error"]);
      return false;
    }
  }

  if (inputFormat === "Interactive") {

    // reset old communicates
    setErrors([]);
    setWarnings([]);
    setApproves([]);

    if (validateStructures()) {
      const joinedText = structures.join("\n");
      setText(joinedText);
      try {
        // send to backend for validation
        console.log("[validateStructure] calling validateRNA...");
        const result = await validateRNA(joinedText);

        if (!result["Validation Result"]) {
          const errorList: string[] = ["Validation failed on server"];

          if (result["Error List"]?.length > 0) {
            // dodajemy każdy błąd jako osobny wpis
            result["Error List"].forEach((err: string) => {
              errorList.push(err);
            });
          }

          setErrors(errorList);
          return false;
        }

        setErrors([]);
        // always set the input to be ready for the engine
        setText(result["Validated RNA"]);

        // jeśli backend zasugerował poprawkę → ustawiamy warning
        if (result["Fix Suggested"] && result["Validated RNA"]) {
          const warningsList: string[] = ["A fix was suggested by the server"];
          if (result["Incorrect Pairs"]?.length > 0) {
            const pairsMsg = result["Incorrect Pairs"]
              .map((pair: [number, number]) => `[${pair[0]} - ${pair[1]}]`)
              .join(", ");
            warningsList.push(`Incorrect Pairs: ${pairsMsg}`);
          }

          if (result["Mismatching Brackets"]?.length > 0) {
            const bracketMsg = result["Mismatching Brackets"]
              .map((pos: number) => pos.toString())
              .join(", ");
            warningsList.push(`Mismatching bracket at positions: ${bracketMsg}`);
            }
            setWarnings(warningsList);
          }

        // jeśli brak błędów i brak warningów → approve
        if (!result["Fix Suggested"]) {
          setApproves(["Validation passed successfully. Input was parsed to the engine's format."]);
        }

        return true;
      } catch (err: any) {
        setErrors([err.message || "Server validation error"]);
        return false;
      }
    }
    else {
      return false;
    }
  }

  return true; // dla File brak walidacji
};

const handleNext = async () => {
  if (currentStep === 0) {
    const isValid = await validateStructure();
    if (isValid) {
      setCurrentStep((prev) => prev + 1);

      try {
        const data = await getSuggestedData();
        if (typeof data?.seed === "number") setSeed(data.seed);
        if (data?.job_name) setJobname(data.job_name);
        setAutoSeed(true);
        setAutoName(true);
      } catch (e) {
        setSeed(34404);
        setJobname('job-150625');
        setAutoSeed(true);
        setAutoName(true);
      }
    }
  } else {
    setCurrentStep((prev) => prev + 1);
  }
};


  const handleSubmit = async () => {
    if (email === "" || emailValidator(email)){
      setCurrentStep(prev => prev + 1)
      try {
        const response = await submitJobRequest({
          fasta_raw: text,
          seed: seed,
          job_name: jobname,
          email: email,
          alternative_conformations: alternativeConformations,
        });

        console.log("[handleSubmit] job created:", response);
        setApproves([`Job '${response.job_name}' submitted successfully.`]);
        setCurrentStep(prev => prev + 1);
      } catch (err: any) {
        console.error("[handleSubmit] error", err);
        setErrors([err.message]);
      }
    }
    else{
        setErrors(["Invalid email address. Valid e-mail can contain only latin letters, numbers, '@' and '.'"])
    }
  }

  const handlePrev = () => {
    setCurrentStep(prev => prev - 1)
  }

  return (
    <div className='submit-jobs-page'>
      <div className='sjp-content'> 
        <div className='sjp-header'>
          <div className='sjp-header-top'>
            <span className='sjp-header-title'>RNA structure form</span>
            <div className="sjp-toggle-button" onClick={() => setIsExpanded(prev => !prev)}>
              <span>{isExpanded ? "show less" : "show more"}</span>
              <img
                  src={isExpanded ? "icons/arrow_up.svg" : "icons/arrow_down.svg"}
                  alt="Toggle icon"
                  className="sjp-toggle-icon"
              />
            </div>
          </div>
          {isExpanded && (
            <p className='sjp-header-bottom'>
              Lorem ipsum dolor sit amet, consectetuer adipiscing elit. 
              Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, 
              nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa 
              quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, 
              imperdiet a, venenatis vitae, justo.
            </p>
          )}
        </div>

        <StepsIndicator totalSteps={3} currentStep ={currentStep}/>

        {currentStep === 0 && (
          <div className='sjp-step-0'>
            <div className='sjp-format-select'>
              <div className='sjp-format-select-left'>
                <span className='sjp-format-top'>Input format</span>
                <span className='sjp-format-bottom'>Choose a format of data input.</span>
              </div>
              <Slider 
                options={["Interactive", "Text", "File"]}
                selectedOption={inputFormat}
                onChange={setInputFormat}
              />
            </div>
            <div className="sjp-line-sep"></div>
            <div className='sjp-hadle-choice'>
              {inputFormat === "Interactive" && (
                <div className='sjp-format-info'>
                  <p className='sjp-format-info-1'>
                    Interactive form
                  </p>
                  <p className='sjp-format-info-2'>
                    Interactive form is based on... Lorem ipsum dolor sit amet, consectetuer adipiscing elit. 
                    Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis partquat massa
                  </p>

                  {/* Nowa sekcja na struktury */}
                  <div className="sjp-structures-section">
                    <p className='sjp-structures-title'>Structures</p>
                    <p className='sjp-structures-subtitle'>Paste structure</p>

                    {structures.map((s, idx) => (
                      <div key={idx} className="sjp-structure-item">
                        <TextArea
                          rows={4}
                          value={s}
                          onChange={(val) => handleStructureChange(idx, val)}
                          placeholder={`CGCGGAACG CGGGACGCG\n((((...(( ))...))))`}
                        />
                      </div>
                    ))}

                    <div className="sjp-add-structure" onClick={addStructure}>
                      <p>+</p>
                    </div>
                  {errors.length > 0 && (
                    <div className="sjp-errors">
                      <MessageBox type="error" messages={errors} />
                    </div>
                  )}

                  {warnings.length > 0 && (
                    <div className="sjp-warnings">
                      <MessageBox type="warning" messages={warnings} />
                    </div>
                  )}

                  {approves.length > 0 && (
                    <div className="sjp-approves">
                      <MessageBox type="approve" messages={approves} />
                    </div>
                  )}
                    </div>
                  </div>
                )}

              {inputFormat === "Text" && (
                  <div className='sjp-format-info'>
                    <p className='sjp-format-info-1'>
                    Format
                    </p>
                    <p className='sjp-format-info-2'>The data should be in format... Lorem ipsum dolor sit amet, consectetuer adipiscing elit. 
                    Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis partquat massa
                    </p>
                  </div>
              )}

              {inputFormat === "File" && (
                <div className='sjp-format'>
                  <div className='sjp-format-info'>
                    <p className='sjp-format-info-1'>
                    Format
                    </p>
                    <p className='sjp-format-info-2'>A valid file should be in .fasta format.
                    </p>
                  </div>
                  <Modal/>
                </div>
              )}
            </div>

            {inputFormat ==="Text" && (
              <div className='sjp-text-input-section' style={{ height: dynamicHeight }}>
                <div className='sjp-text-input-examples'>
                  <div className='sjp-examples-left'>
                      <p>Choose one of the examples to try out some examplary data.</p>
                  </div>
                  <div className='sjp-examples-right'>
                      <Button
                        color="green1"
                        width='175px'
                        height='30px'
                        label='Example 1'
                        fontSize='12px'
                      />
                      <Button
                        color="green2"
                        width='175px'
                        height='30px'
                        label='Example 2'
                        fontSize='12px'
                      />
                      <Button
                        color="green3"
                        width='175px'
                        height='30px'
                        label='Example 3'
                        fontSize='12px'
                      />
                  </div>
                </div>
                <div className='sjp-input-area'>
                  RNA structure
                  <TextArea
                    rows={6}
                    value={text}
                    onChange={setText}
                    placeholder={`CGCGGAACG CGGGACGCG\n((((...(( ))...))))`}
                  />
                </div>
                {errors.length > 0 && (
                  <div className="sjp-errors">
                    <MessageBox type="error" messages={errors} />
                  </div>
                )}

                {warnings.length > 0 && (
                  <div className="sjp-warnings">
                    <MessageBox type="warning" messages={warnings} />
                  </div>
                )}

                {approves.length > 0 && (
                  <div className="sjp-approves">
                    <MessageBox type="approve" messages={approves} />
                  </div>
                )}
              </div>
            )}

            {(inputFormat === "Text" || inputFormat === "Interactive") && (
              <div className='sjp-buttons-section'>
                <Button
                  color='primary'
                  variant='filled'
                  width='201px'
                  height='50px'
                  label='Next'
                  fontSize='18px'
                  action={handleNext}
                />
                <Button
                  color='primary'
                  variant='outlined'
                  width='277px'
                  height='50px'
                  label='Validate structure'
                  action={validateStructure}
                  fontSize='18px'
                />
              </div>
            )}
          </div>
        )}

        {currentStep === 1 && (
          <div>
            <div className='sjp-params-section'>
              <div className='sjp-opt-params'>
                <p className='sjp-opt-params-1'>
                  Optional parameters
                </p>
                <p className='sjp-opt-params-2'>
                  You can provide some optional parameters for the calculation process
                </p>
              </div>

              <div className='sjp-params-fields'>
                {/* --- SEED --- */}
                  <div className='sjp-seed-name-param'>
                    <p>Seed <span>{autoSeed ? seed : ""}</span></p>
                    <CustomCheckbox
                      label="auto"
                      size={45}
                      onChange={setAutoSeed}
                    />
                  </div>
                  {!autoSeed && (
                    <TextArea
                      rows={1}
                      value={seed.toString()}
                      onChange={(val) => setSeed(Number(val))}
                      placeholder="Enter custom seed"
                    />
                  )}

                  {/* --- JOB NAME --- */}
                  <div className='sjp-seed-name-param'>
                    <p>Name <span>{autoName ? jobname : ""}</span></p>
                    <CustomCheckbox
                      label="auto"
                      size={45}
                      onChange={setAutoName}
                    />
                  </div>
                  {!autoName && (
                    <TextArea
                      rows={1}
                      value={jobname}
                      onChange={setJobname}
                      placeholder="Enter custom job name"
                    />
                  )}


                {/* --- INTEGER FIELD --- */}
                <div className='sjp-alt-param'>
                  <IntegerField
                    min={1}
                    max={5}
                    width="975px"
                    height="50px"
                    defaultValue={alternativeConformations}
                    onChange={(val) => setAlternativeConformations(val)}
                  />
                </div>
              </div>

              <div className='sjp-step1-buttons'>
                <Button
                  color='primary'
                  variant='filled'
                  width='201px'
                  height='50px'
                  label='Next'
                  fontSize='18px'
                  action={handleNext}
                />
                <Button
                  color='primary'
                  variant='outlined'
                  width='277px'
                  height='50px'
                  label='Previous'
                  fontSize='18px'
                  action={handlePrev}
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <div className='sjp-params-section'>
              <div className='sjp-opt-params'>
                <p className='sjp-opt-params-1'>
                  Optional parameters
                </p>
                <p className='sjp-opt-params-2'>
                  You can provide some optional parameters for the calculation process
                </p>
              </div>

              <div className='sjp-params-fields'>
                <div className='sjp-email-param'>
                  <p>E-mail <span>(optional)</span></p>
                  <TextArea
                    rows={1}
                    value={email}
                    onChange={setEmail}
                    placeholder="your@email.com"
                  />
                {errors.length > 0 && (
                  <div className="sjp-errors">
                    {errors.length > 0 && (
                      <div className="sjp-errors">
                        <MessageBox type="error" messages={errors} />
                      </div>
                    )}

                    {warnings.length > 0 && (
                      <div className="sjp-warnings">
                        <MessageBox type="warning" messages={warnings} />
                      </div>
                    )}

                    {approves.length > 0 && (
                      <div className="sjp-approves">
                        <MessageBox type="approve" messages={approves} />
                      </div>
                    )}
                  </div>
                )}
                </div>
              </div>

              <div className='sjp-step1-buttons'>
                <Button
                  color='primary'
                  variant='filled'
                  width='201px'
                  height='50px'
                  label='Submit'
                  fontSize='18px'
                  action={handleSubmit}
                />
                <Button
                  color='primary'
                  variant='outlined'
                  width='277px'
                  height='50px'
                  label='Previous'
                  fontSize='18px'
                  action={handlePrev}
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 3  && (
          <div>
            <p>{email} {text} {seed} {jobname} {structures}</p>
          </div>
        )}
      </div>
    </div>
  );
}