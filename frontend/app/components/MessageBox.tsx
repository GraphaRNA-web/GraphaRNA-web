import React from 'react';
import '../styles/messageBox.css';


type MessageType = 'error' | 'warning' | 'approve';

interface MessageBoxProps {
  type: MessageType;
  messages: string[] | string;
}

const MessageBox: React.FC<MessageBoxProps> = ({ type, messages }) => {
  const messageList = Array.isArray(messages) ? messages : [messages];
  const isMultiple = messageList.length > 1;

  const icons: Record<MessageType, string> = { // Need to change the icons :)
    error: "icons/error.svg",
    warning: "icons/error.svg",
    approve: "icons/error.svg"
  };

  const headers: Record<MessageType, string> = {
    error: "Some errors appeared:",
    warning: "Warnings:",
    approve: "Success!"
  };

  const footers: Record<MessageType, string> = {
    error: "Please correct the errors!",
    warning: "",
    approve: ""
  };

  return (
    <div className={`message-box ${type}`}>
      {isMultiple ? (
        <div className="message-multiple">
          <p className="message-header">{headers[type]}</p>
          {messageList.map((msg, index) => (
            <div className="message-line" key={index}>
              <img src={icons[type]} width={24} height={24} />
              <p>{msg}</p>
            </div>
          ))}
          {type === 'error' && (
            <p className="message-footer">{footers[type]}</p>
          )}
        </div>
      ) : (
        <div className="message-line">
          <img src={icons[type]} width={24} height={24} />
          <p>{messageList[0]}</p>
        </div>
      )}
    </div>
  );
};

export default MessageBox;
