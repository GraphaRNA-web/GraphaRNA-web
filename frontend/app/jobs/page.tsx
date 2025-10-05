'use client';

import { useState } from 'react';
import { validateRNA, getSuggestedData, submitJobRequest } from "@/lib/api";
import { useRouter } from "next/navigation";
import Modal from '../components/Modal';
import Slider from '../components/Slider';
import '../styles/jobs.css';
import Button from '../components/Button';
import StepsIndicator from '../components/StepsIndicator';
import TextArea from '../components/TextArea';
import CustomCheckbox from '../components/CustomCheckbox';
import IntegerField from '../components/IntegerField';
import MessageBox from '../components/MessageBox';
import ValidationWarningModal from "../components/ValidationWarningModal";



export default function Jobs() {
  const router = useRouter();
  const [inputFormat, setInputFormat] = useState("Text");
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [text, setText] = useState('');
  const [correctedText, setCorrectedText] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  const [showValidationNext, setShowValidationNext] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [approves, setApproves] = useState<string[]>([]);
  const [autoSeed, setAutoSeed] = useState(true);
  const [autoName, setAutoName] = useState(true);
  const [seed, setSeed] = useState(0);
  const [jobname, setJobname] = useState("");
  const [email, setEmail] = useState("");
  const [alternativeConformations, setAlternativeConformations] = useState(1);
  const [structures, setStructures] = useState<string[]>([""]);
  const [mismatchingBrackets, setMismatchingBrackets] = useState<number[]>([]);
  const [incorrectPairs, setIncorrectPairs] = useState<[number, number][]>([]);

  const dynamicHeight = 500 + 50 * errors.length + 50 * approves.length

  const emailValidator = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);


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

type ValidationResult = "error" | "warning" | "ok";

const validateStructure = async (fromNext = false) : Promise<ValidationResult> => {
  if (inputFormat === "Text") {
    const trimmedText = text;
    console.log("[validateStructure] start", { inputFormat, text });

    // reset old communicates
    setErrors([]);
    setWarnings([]);
    setApproves([]);

    if (trimmedText === '') {
      setErrors(["Input cannot be empty."]);
      return "error";
    }

    try {
      console.log("[validateStructure] calling validateRNA...");
      const result = await validateRNA({ fasta_raw: trimmedText });

      setMismatchingBrackets(result["Mismatching Brackets"] || []);
      setIncorrectPairs(result["Incorrect Pairs"] || []);

      if (!result["Validation Result"]) {
        let errorList: string[] = [];

        if (Array.isArray(result["Error List"]) && result["Error List"].length > 0) {
          const flatErrors = result["Error List"].flat();
          errorList = errorList.concat(flatErrors);
        }

        console.log("ErrorList: ", errorList);
        setErrors(errorList);
        return "error";
      }

      // always set the input to be ready for the engine
      setCorrectedText(result["Validated RNA"]);

      // jeśli backend zasugerował poprawkę → ustawiamy warning
      
      if (result["Fix Suggested"] && result["Validated RNA"]) {
        setText(trimmedText);
        setCorrectedText(result["Validated RNA"]);
        return "warning"
      }

      // jeśli brak błędów i brak warningów → approve
      if (!result["Fix Suggested"]) {
        setText(result["Validated RNA"])
        setApproves(["Validation passed successfully. Input was parsed to the engine's format."]);
      }

      return "ok";
    } catch (err: any) {
      setErrors([err.message || "Server validation error"]);
      return "error";
    }
  }

  if (inputFormat === "Interactive") {
    setErrors([]);
    setWarnings([]);
    setApproves([]);

    if (validateStructures()) {
      // znormalizowany format
      const normalized = structures
      .map((s, idx) => {
        const lines = s
          .split("\n")
          .map(l => l.trim())
          .filter(l => l !== "" && !l.startsWith("#"));

        if (lines.length === 0) return "";

        if (lines[0].startsWith(">")) {
          return lines.join("\n");
        } else {
          return `>auto${idx + 1}\n${lines.join("\n")}`;
        }
      })
      .filter(block => block !== "")
      .join("\n");

      setText(normalized)

      try {
        console.log("[validateStructure] calling validateRNA...");
        const result = await validateRNA({fasta_raw: normalized});

        setMismatchingBrackets(result["Mismatching Brackets"] || []);
        setIncorrectPairs(result["Incorrect Pairs"] || []);

        if (!result["Validation Result"]) {
          const errorList: string[] = [];
          if (result["Error List"]?.length > 0) {
            result["Error List"].forEach((err: string) => {
              errorList.push(err);
            });
          }
          setErrors(errorList);
          return "error";
        }

        setErrors([]);
        setCorrectedText(result["Validated RNA"]);

        if (result["Fix Suggested"] && result["Validated RNA"]) {
          setCorrectedText(result["Validated RNA"]);
          return "warning"
        }

        if (!result["Fix Suggested"]) {
          setText(result["Validated RNA"])
          setApproves([
            "Validation passed successfully. Input was parsed to the engine's format.",
          ]);
        }

        return "ok";
      } catch (err: any) {
        setErrors([err.message || "Server validation error"]);
        return "error";
      }
    }
  }

  return "ok"; // dla File brak walidacji
};

const handleValidate = async () => {
  const res = await validateStructure(false);
  if (res === "warning") {
    setShowValidation(true)
  }
};

const handleNext = async () => {
  if (currentStep === 0) {
    const res = await validateStructure(true);
    if (res === "warning") {
      setShowValidationNext(true)
    } else if (res === "ok") {
      goNext();
    }
  } else {
    goNext();
  }
};

const goNext = async () => {
  setCurrentStep((prev) => prev + 1);
  try {
    const data = await getSuggestedData();
    if (typeof data?.seed === "number") setSeed(data.seed);
    if (data?.job_name) setJobname(data.job_name);
    setAutoSeed(true);
    setAutoName(true);
  } catch (e) {
    setSeed(34404);
    setJobname("job-150625");
    setAutoSeed(true);
    setAutoName(true);
  }
  };


  const handleSubmit = async () => {
    if (email === "" || emailValidator(email)) {
      setCurrentStep(prev => prev + 1);
      try {
        const response = await submitJobRequest({
          fasta_raw: text,
          seed: seed,
          job_name: jobname,
          email: email,
          alternative_conformations: alternativeConformations,
        });

        console.log("[handleSubmit] job created:", response);
        setApproves([`Job '${response.Job}' submitted successfully.`]);
        setCurrentStep(prev => prev + 1);

        router.push(`/results?uidh=${response.job_hash}`);

      } catch (err: any) {
        console.error("[handleSubmit] error", err);
        setErrors([err.message]);
      }
    } else {
      setErrors([
        "Invalid email address. Valid e-mail can contain only latin letters, numbers, '@' and '.'",
      ]);
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => prev - 1);
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
                      <MessageBox type="error" messages={errors} />
                    </div>
                  )}

                  {approves.length > 0 && (
                    <div className="jp-approves">
                      <MessageBox type="approve" messages={approves} />
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
                    <MessageBox type="error" messages={errors} />
                  </div>
                )}

                {approves.length > 0 && (
                  <div className="jp-approves">
                    <MessageBox type="approve" messages={approves} />
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
                  action={handleValidate}
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
                    {errors.length > 0 && (
                      <div className="jp-errors">
                        <MessageBox type="error" messages={errors} />
                      </div>
                    )}

                    {warnings.length > 0 && (
                      <div className="jp-warnings">
                        <MessageBox type="warning" messages={warnings} />
                      </div>
                    )}

                    {approves.length > 0 && (
                      <div className="jp-approves">
                        <MessageBox type="approve" messages={approves} />
                      </div>
                    )}
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
        <ValidationWarningModal
          isOpen={showValidation || showValidationNext}
          onClose={() => {
            setShowValidation(false);
            setShowValidationNext(false);
          }}
          onConfirm={() => {
            // jeśli user klika Agree
            setText(correctedText);

            if (inputFormat === "Interactive") {
              // podmiana structures na poprawione
              const blocks = correctedText
                .split("\n>")
                .map((b, i) => (i === 0 ? b : ">" + b)) // zachowaj '>' dla kolejnych
                .filter((b) => b.trim() !== "");

              setStructures(blocks);
            }

            if (showValidationNext) {
              goNext();
            }

            setShowValidation(false);
            setShowValidationNext(false);
          }}
          text={text}
          correctedText={correctedText}
          mismatchingBrackets={mismatchingBrackets}
          incorrectPairs={incorrectPairs}
        />
      </div>
    </div>
    
  );
}