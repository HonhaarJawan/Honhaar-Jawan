import React from "react";

const InputField = ({
  type = "text",
  placeholder = "",
  className = "",
  labelClassName = "text-sm md:text-base", // Default label class name
  value,
  onChange,
  name,
  required = false,
  label = "",
  container,
}) => {
  // 1) Check if className contains a width class (w-*) to avoid overriding
  const hasCustomWidth = className.includes("w-");

  // 2) Define base classes for label and input for light mode
  const labelClasses = `mb-1 font-medium text-zinc-800  ${labelClassName}`;
  const inputClasses = ` input input-md input-outline-zinc-500 focus:input-outline-zinc-600
    ${hasCustomWidth ? "" : "w-full"}
     
  `;

  // 3) Combine computed classes with user-provided className
  const finalLabelClassName = labelClasses.trim();
  const finalInputClassName = `${inputClasses} ${className}`.trim();

  return (
    <div className={`flex flex-col items-start ${container || ""}`}>
      {label && (
        <label htmlFor={name} className={finalLabelClassName}>
          {label}
        </label>
      )}

      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={finalInputClassName}
      />
    </div>
  );
};

export default InputField;
