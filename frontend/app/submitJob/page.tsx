'use client';

import { useState, useEffect } from 'react';
import { validateRNA, getSuggestedData, submitJobRequest, submitExampleJobRequest } from "@/lib/api";
import { useRouter } from "next/navigation";  
import Modal from '../components/Modal';
import Slider from '../components/Slider';
import '../styles/submitJob.css';
import Button from '../components/Button';
import StepsIndicator from '../components/StepsIndicator';
import TextArea from '../components/TextArea';
import CustomCheckbox from '../components/CustomCheckbox';
import IntegerField from '../components/IntegerField';
import MessageBox from '../components/MessageBox';
import ServerErrorModal from '../components/ServerErrorModal';
import ValidationWarningModal from "../components/ValidationWarningModal";
import FileDisplay from '../components/FileDisplay';
const getEnvExample = (val: string | undefined) => {
  if (!val) return "";
  return val.replace(/\\n/g, "\n");
};

export default function SubmitJob() {
  const [examples, setExamples] = useState<string[]>(["", "", ""]);
  
  useEffect(() => {
    fetch('/api/config')
      .then((res) => {
        if (!res.ok) throw new Error("Config fetch failed");
        return res.json();
      })
      .then((data) => {
        const fixNewlines = (val: string) => val ? val.replace(/\\n/g, "\n") : "";
        
        setExamples([
          fixNewlines(data.rnaExample1),
          fixNewlines(data.rnaExample2),
          fixNewlines(data.rnaExample3)
        ]);
      })
      .catch((err) => console.error("Failed to load runtime config:", err));
  }, []);


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
  const [jobname, setJobname] = useState("job-155555");
  const [email, setEmail] = useState("");
  const [alternativeConformations, setAlternativeConformations] = useState(1);
  const [structures, setStructures] = useState<string[]>([""]);
  const [mismatchingBrackets, setMismatchingBrackets] = useState<number[]>([]);
  const [incorrectPairs, setIncorrectPairs] = useState<[number, number][]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [selectedExampleNumber, setSelectedExampleNumber] = useState<number>(0);
  const [displayCheckbox, setDisplayCheckbox] = useState(true);
  const [server500, setServer500] = useState(false);


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

const handleFormatChange = (newFormat: string) => {
    setInputFormat(newFormat);
    setErrors([]);
    setWarnings([]);
    setApproves([]);
    setMismatchingBrackets([]);
    setIncorrectPairs([]);
    
    if (newFormat !== "File") {
      setUploadedFile(null);
      setText("");
    }
  };

const handleFileUploaded = async (file: File) => {
    setUploadedFile(file);
    setIsFileModalOpen(false);

    try {
      const fileContent = await file.text();
      setText(fileContent);
    } catch (e) {
      setErrors(["Error reading file content."]);
      setText("");
    }
    
    setErrors([]);
    setWarnings([]);
    setApproves([]);
  };


const handleStructureChange = (index: number, newValue: string) => {
  const updated = [...structures];
  updated[index] = newValue;
  setStructures(updated);
};

const addStructure = () => {
  setStructures([...structures, ""]);
};

const removeStructure = (index: number) => {
  setStructures(prev => prev.filter((_, i) => i !== index));
};

type ValidationResult = "error" | "warning" | "ok";

const validateStructure = async (fromNext = false) : Promise<ValidationResult> => {
  if (inputFormat === "Text" || inputFormat === "File") {
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
      const { result, status} = await validateRNA({fasta_raw: trimmedText});
      console.log(result, status);

      if(status >= 400 && status < 500){
        setErrors([result.error]);
        return "error";
      }
      else if(status >= 500){
        setServer500(true);
        return "error";
      }

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
        setApproves(["The structure is valid. You can now proceed with the job."]);
      }

      return "ok";
    } catch (err: any) {
      console.error("Validation failed:", err);
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
        const { result, status} = await validateRNA({fasta_raw: normalized});

        setMismatchingBrackets(result["Mismatching Brackets"] || []);
        setIncorrectPairs(result["Incorrect Pairs"] || []);

        if(status >= 400 && status < 500){
          setErrors([result.error]);
          return "error";
        }
        else if(status >= 500){
          setServer500(true);
          return "error";
        }

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
            "The structure is valid. You can now proceed with the job.",
          ]);
        }

        return "ok";
      } catch (err: any) {
        console.error("Validation failed:", err);
        setErrors([err.message || "Server validation error"]);
        return "error";
      }
    }
    else {
      return "error";
    }
  }
  return "error" // that should be unreachable in normal circumstances
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
    console.log(res);
    if (res === "warning") {
      setShowValidationNext(true)
    } else if (res === "ok") {
      goNextWithGetSuggestedData();
    }
  } else {
    goNext();
  }
};

const goNextWithGetSuggestedData = async () => {
  setCurrentStep((prev) => prev + 1);

  let effectiveExampleNumber = selectedExampleNumber;

  const isExampleValid = selectedExampleNumber !== 0 && examples.includes(text);
  
  if  (isExampleValid){
    setDisplayCheckbox(false);
  }
  else{
    setDisplayCheckbox(true);
    setSelectedExampleNumber(0);
    effectiveExampleNumber = 0;  
  } 
  try {
    const data = await getSuggestedData(effectiveExampleNumber);
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

  const goNext = async () => {
    setCurrentStep((prev) => prev + 1);
  };

  const handleSubmit = async () => {
    if (uploadedFile === null && selectedExampleNumber !== 0){
      if ((!examples.includes(text))){
        setSelectedExampleNumber(0);
      }
    }
    if (email === "" || emailValidator(email)){
      setCurrentStep(prev => prev + 1)
      if  (selectedExampleNumber === 0){
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
          router.push(`/results?uidh=${response.uidh}`);
        } catch (err: any) {
          console.error("[handleSubmit] error", err);
          setErrors([err.message]);
        }
      }
      else{
        try {
          const response = await submitExampleJobRequest({
            fasta_raw: text,
            email: email,
            example_number: selectedExampleNumber,
          });

          console.log("[handleSubmit] job created:", response);
          setApproves([`Job '${response.job_name}' submitted successfully.`]);
          setCurrentStep(prev => prev + 1);
          router.push(`/results?uidh=${response.uidh}`);
        } catch (err: any) {
          console.error("[handleSubmit] error", err);
          setErrors([err.message]);
        }
      }
    }
    else{
        setErrors(["Invalid email address. Valid e-mail can contain only latin letters, numbers, '@' and '.'"])
    }
  }

  const handlePrev = () => {
    setCurrentStep(prev => prev - 1);
  }

  const handleExampleClick1 = async () => {
      setText(examples[0]);
      setSelectedExampleNumber(1);
  };

  const handleExampleClick2 = async () => {
      setText(examples[1]);
      setSelectedExampleNumber(2);
  };

  const handleExampleClick3 = async () => {
      setText(examples[2]);
      setSelectedExampleNumber(3);
  };

  return (
    <div className='submit-jobs-page'>
      <div className='sjp-content'> 
        <div className='sjp-header' style={{ height: isExpanded ? 'auto' : '35px', overflow: 'hidden' }}>
          <div className='sjp-header-top'>
            <div className='sjp-header-title-div'>
              {currentStep > 0 && currentStep < 3 && (
                <img
                  src="icons/arrow_back.svg"
                  alt="Next step"
                  className="sjp-step-arrow"
                  style={{ width: "20px", height: "20px" }}
                  onClick={handlePrev}
                />
              )}
              <p className='sjp-header-title'>RNA structure form</p>
            </div>
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
                <p className='sjp-format-top'>Input format</p>
                <Slider 
                  options={["Interactive", "Text", "File"]}
                  selectedOption={inputFormat}
                  onChange={handleFormatChange}
                />
            </div>
            
            {/*Sekcja na szarym tle INTERACTIVE*/}
            {inputFormat === "Interactive" && (
              <div className='sjp-int-gray-box'>
                <div className='sjp-int-hint'>
                  <p className='sjp-hint-title'>Interactive form hint</p>
                  <p className='sjp-hint-text'>Interactive form is based on... Lorem ipsum dolor sit amet, 
                    consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque 
                    penatibus et magnis dis partquat massa</p>
                </div>

                <div className='sjp-int-input-title'>
                  <p className='sjp-rna-structure-title'>RNA structure</p>
                  <p className='sjp-rna-structure-text'>Paste sequence with dotbracket and add another if needed.</p>
                </div>

                {structures.map((s, idx) => (
                  <div key={idx} className="sjp-structure-item" style={{ position: 'relative', marginBottom: '20px' }}>
                    <TextArea
                      rows={4}
                      value={s}
                      onChange={(val) => handleStructureChange(idx, val)}
                      placeholder={`CGCGGAACG CGGGACGCG\n((((...(( ))...))))`}
                    />

                    {structures.length > 1 && (
                      <img
                        src="/icons/delete.svg"
                        alt="Usuń"
                        onClick={() => removeStructure(idx)}
                        style={{
                          position: 'absolute',
                          top: '20px',
                          right: '18px',
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer'
                        }}
                      />
                    )}
                  </div>
                ))}

                <div className="sjp-add-structure" onClick={addStructure}>
                  <p>+</p>
                </div>
                {errors.length > 0 && (
                    <div className="sjp-errors" >
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
            
            {/*Sekcja na szarym tle TEXT*/}
            {inputFormat === "Text" && (
              <div className='sjp-int-gray-box'>
                <div className='sjp-int-hint'>
                  <p className='sjp-hint-title'>Format hint</p>
                  <p className='sjp-hint-text'>Interactive form is based on... Lorem ipsum dolor sit amet, 
                    consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque 
                    penatibus et magnis dis partquat massa</p>
                </div>

                <div className='sjp-text-input-title'>
                  <p className='sjp-rna-structure-title'>RNA structure</p>
                  <div className='sjp-text-examples'>
                    <Button
                      color="green1"
                      width='175px'
                      height='30px'
                      label='Example 1'
                      fontSize='12px'
                      action={handleExampleClick1}
                    />
                    <Button
                      color="green2"
                      width='175px'
                      height='30px'
                      label='Example 2'
                      fontSize='12px'
                      action={handleExampleClick2}
                    />
                    <Button
                      color="green3"
                      width='175px'
                      height='30px'
                      label='Example 3'
                      fontSize='12px'
                      action={handleExampleClick3}
                    />
                  </div>
                </div>
                <TextArea
                  rows={6}
                  value={text}
                  onChange={setText}
                 placeholder={"CGCGGAACG CGGGACGCG\n((((...(( ))...))))"}
                />

                {errors.length > 0 && (
                  <div className="sjp-errors" >
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

            {inputFormat === "File" && (
            <div className='sjp-int-gray-box'>
              <div className='sjp-hint-upload'>
                <div className='sjp-file-hint'>
                  <p className='sjp-hint-title'>Format hint</p>
                  <p className='sjp-hint-text'>A valid file should be in .fasta format.</p>
                </div>
                
                {!uploadedFile ? (
                  <Button
                    color="primary"
                    variant="filled"
                    fontSize="16px"
                    width="200px"
                    height="40px"
                    action={() => setIsFileModalOpen(true)}
                    icon={<img src="icons/white_upload.svg" alt="Upload Icon" style={{ height: 24, width: 24 }} />}
                    label="Upload File"
                  />
                ) : (
                  <FileDisplay 
                    fileName={uploadedFile.name}
                    onEdit={() => setIsFileModalOpen(true)}
                  />
                )}
              </div>

              <Modal 
                isOpen={isFileModalOpen}
                onClose={() => setIsFileModalOpen(false)}
                onFileUploaded={handleFileUploaded}
                setSelectedExampleNumber={setSelectedExampleNumber}
                />

              {errors.length > 0 && (
                <div className="sjp-errors" >
                  <MessageBox type="error" messages={errors} />
                </div>
              )}

              {approves.length > 0 && (
                <div className="sjp-approves">
                  <MessageBox type="approve" messages={approves} />
                </div>
              )}
            </div>
          )}
              <div className='sjp-buttons-section'>
                <Button
                  color='primary'
                  variant='filled'
                  width='160px'
                  height='40px'
                  label='Next'
                  fontSize='16px'
                  action={handleNext}
                />
                <Button
                  color='primary'
                  variant='outlined'
                  width='230px'
                  height='40px'
                  label='Validate structure'
                  action={handleValidate}
                  fontSize='16px'
                />
              </div>
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
                        isActive={displayCheckbox}
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
                    <p>Name <span>{autoName ? jobname : "job"}</span></p>
                    <CustomCheckbox
                        label="auto"
                        size={45}
                        onChange={setAutoName}
                        isActive={displayCheckbox}
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
                 {displayCheckbox && (
                  <div>
                  <p>#Alternative conformations</p>
                  <IntegerField
                    min={1}
                    max={5}
                    width="100%"
                    height="50px"
                    defaultValue={alternativeConformations}
                    onChange={(val) => setAlternativeConformations(val)}
                  />
                  </div>
                  )} 

                  {!displayCheckbox && (
                  <div>
                    <p>#Alternative conformations <span>{alternativeConformations}</span></p>
                  </div>
                  )}

                </div>
              </div>
              

              <div className='sjp-step1-buttons'>
                <Button
                  color='primary'
                  variant='filled'
                  width='160px'
                  height='40px'
                  label='Next'
                  fontSize='16px'
                  action={handleNext}
                />
                <Button
                  color='primary'
                  variant='outlined'
                  width='230px'
                  height='40px'
                  label='Previous'
                  fontSize='16px'
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
                  width='160px'
                  height='40px'
                  label='Submit'
                  fontSize='16px'
                  action={handleSubmit}
                />
                <Button
                  color='primary'
                  variant='outlined'
                  width='230px'
                  height='40px'
                  label='Previous'
                  fontSize='16px'
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

        <ServerErrorModal
          isOpen={server500}
          onClose={() => setServer500(false)}
        />

        <ValidationWarningModal
          isOpen={showValidation || showValidationNext}
          onClose={() => {
            setShowValidation(false);
            setShowValidationNext(false);
          }}
          onConfirm={() => {
            setText(correctedText);

            if (inputFormat === "Interactive") {
              const blocks = correctedText
                .split("\n>")
                .map((b, i) => (i === 0 ? b : ">" + b))
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