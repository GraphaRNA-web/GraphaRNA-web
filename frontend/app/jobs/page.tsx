'use client';

import {useState } from 'react';
import Modal from '../components/Modal';
import Slider from '../components/Slider';
import '../styles/jobs.css';
import Button from '../components/Button';
import StepsIndicator from '../components/StepsIndicator';
import ErrorBox from '../components/ErrorBox';
import TextArea from '../components/TextArea';
import CustomCheckbox from '../components/CustomCheckbox';
import IntegerField from '../components/IntegerField';


export default function Jobs() {
  const [inputFormat, setInputFormat] = useState("Text");
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [text, setText] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [autoSeed, setAutoSeed] = useState(false);
  const [autoName, setAutoName] = useState(false);
  const [seed, setSeed] = useState(25318);
  const [jobname, setJobname] = useState("job-150625");
  const [email, setEmail] = useState("");


  const allowedCharacters = /^[ACGUacgu(.)\s\n]*$/;

  const dynamicHeight = 500 + 50 * errors.length

  const rnaValidator = (val: string) => /^[ACGUacgu(.)\s\n]*$/.test(val);
  const emailValidator = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const [structures, setStructures] = useState<string[]>([""]);

const validateStructures = (): boolean => {
  const newErrors: string[] = [];

  structures.forEach((s, idx) => {
    const trimmed = s.trim();
    if (trimmed === '') {
      newErrors.push(`Structure ${idx + 1} cannot be empty.`);
    } else if (!allowedCharacters.test(trimmed)) {
      newErrors.push(`Structure ${idx + 1} contains invalid characters.`);
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


const validateStructure = (): boolean => {
  if (inputFormat === "Text") {
    const trimmedText = text.trim();

    if (trimmedText === '') {
      setErrors(["Input cannot be empty."]);
      return false;
    } else if (!allowedCharacters.test(trimmedText)) {
      setErrors([
        "Input contains invalid characters. Only A, C, G, U, spaces, dots, brackets and line breaks are allowed."
      ]);
      return false;
    } else {
      setErrors([]);
      return true;
    }
  } else if (inputFormat === "Interactive") {
    return validateStructures();
  }
  return true; // dla File nie ma walidacji tutaj
};

const handleNext = () => {
  if (currentStep === 0) {
    const isValid = validateStructure();
    if (isValid) {
      setCurrentStep(prev => prev + 1);
    }
  } else {
    setCurrentStep(prev => prev + 1);
  }
};


  const handleSubmit = () => {
    if (email === ""){
      setCurrentStep(prev => prev + 1)
    }
    else{
      if (emailValidator(email)){
          setCurrentStep(prev => prev + 1)
      }
      else{
        setErrors(["Invalid email address. Valid e-mail can contain only latin letters, numbers, '@' and '.'"])
      }
    }
  }

  const handlePrev = () => {
    setCurrentStep(prev => prev - 1)
  }

  return (
    <div className='jobs-page'>
      <div className='jp-content'> 
        <div className='jp-header'>
          <div className='jp-header-top'>
            <span className='jp-header-title'>RNA structure form</span>
            <div className="jp-toggle-button" onClick={() => setIsExpanded(prev => !prev)}>
              <span>{isExpanded ? "show less" : "show more"}</span>
              <img
                  src={isExpanded ? "arrow_up.svg" : "arrow_down.svg"}
                  alt="Toggle icon"
                  className="jp-toggle-icon"
              />
            </div>
          </div>
          {isExpanded && (
            <p className='jp-header-bottom'>
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
          <div className='jp-step-0'>
            <div className='jp-format-select'>
              <div className='jp-format-select-left'>
                <span className='jp-format-top'>Input format</span>
                <span className='jp-format-bottom'>Choose a format of data input.</span>
              </div>
              <Slider 
                options={["Interactive", "Text", "File"]}
                selectedOption={inputFormat}
                onChange={setInputFormat}
              />
            </div>
            <div className="jp-line-sep"></div>
            <div className='jp-hadle-choice'>
              {inputFormat === "Interactive" && (
                <div className='jp-format-info'>
                  <p className='jp-format-info-1'>
                    Interactive form
                  </p>
                  <p className='jp-format-info-2'>
                    Interactive form is based on... Lorem ipsum dolor sit amet, consectetuer adipiscing elit. 
                    Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis partquat massa
                  </p>

                  {/* Nowa sekcja na struktury */}
                  <div className="jp-structures-section">
                    <p className='jp-structures-title'>Structures</p>
                    <p className='jp-structures-subtitle'>Paste structure</p>

                    {structures.map((s, idx) => (
                      <div key={idx} className="jp-structure-item">
                        <TextArea
                          rows={4}
                          value={s}
                          onChange={(val) => handleStructureChange(idx, val)}
                          placeholder={`CGCGGAACG CGGGACGCG\n((((...(( ))...))))`}
                        />
                      </div>
                    ))}

                    <div className="jp-add-structure" onClick={addStructure}>
                      <p>+</p>
                    </div>
                    {errors.length > 0 && (
                      <div className="jp-errors">
                        <ErrorBox errors={errors} />
                      </div>
                    )}
                  </div>
                </div>
              )}


              {inputFormat === "Text" && (
                  <div className='jp-format-info'>
                    <p className='jp-format-info-1'>
                    Format
                    </p>
                    <p className='jp-format-info-2'>The data should be in format... Lorem ipsum dolor sit amet, consectetuer adipiscing elit. 
                    Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis partquat massa
                    </p>
                  </div>
              )}

              {inputFormat === "File" && (
                <div className='jp-format'>
                  <div className='jp-format-info'>
                    <p className='jp-format-info-1'>
                    Format
                    </p>
                    <p className='jp-format-info-2'>A valid file should be in .fasta format.
                    </p>
                  </div>
                  <Modal/>
                </div>
              )}
            </div>

            {inputFormat ==="Text" && (
              <div className='jp-text-input-section' style={{ height: dynamicHeight }}>
                <div className='jp-text-input-examples'>
                  <div className='jp-examples-left'>
                      <p>Choose one of the examples to try out some examplary data.</p>
                  </div>
                  <div className='jp-examples-right'>
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
                <div className='jp-input-area'>
                  RNA structure
                  <TextArea
                    rows={6}
                    value={text}
                    onChange={setText}
                    placeholder={`CGCGGAACG CGGGACGCG\n((((...(( ))...))))`}
                  />
                </div>
                {errors.length > 0 && (
                  <div className="jp-errors">
                    <ErrorBox errors={errors} />
                  </div>
                )}
              </div>
            )}

            {(inputFormat === "Text" || inputFormat === "Interactive") && (
              <div className='jp-buttons-section'>
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
            <div className='jp-params-section'>
              <div className='jp-opt-params'>
                <p className='jp-opt-params-1'>
                  Optional parameters
                </p>
                <p className='jp-opt-params-2'>
                  You can provide some optional parameters for the calculation process
                </p>
              </div>

              <div className='jp-params-fields'>
                {/* --- SEED --- */}
                  <div className='jp-seed-name-param'>
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
                  <div className='jp-seed-name-param'>
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
                <div className='jp-alt-param'>
                  #Alternative conformations
                  <IntegerField
                    min={1}
                    max={5}
                    width="975px"
                    height="50px"
                    defaultValue={1}
                    onChange={(val) => console.log("Nowa wartość:", val)}
                  />
                </div>
              </div>

              <div className='jp-step1-buttons'>
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
            <div className='jp-params-section'>
              <div className='jp-opt-params'>
                <p className='jp-opt-params-1'>
                  Optional parameters
                </p>
                <p className='jp-opt-params-2'>
                  You can provide some optional parameters for the calculation process
                </p>
              </div>

              <div className='jp-params-fields'>
                <div className='jp-email-param'>
                  <p>E-mail <span>(optional)</span></p>
                  <TextArea
                    rows={1}
                    value={email}
                    onChange={setEmail}
                    placeholder="your@email.com"
                  />
                {errors.length > 0 && (
                  <div className="jp-errors">
                    <ErrorBox errors={errors} />
                  </div>
                )}
                </div>
              </div>

              <div className='jp-step1-buttons'>
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