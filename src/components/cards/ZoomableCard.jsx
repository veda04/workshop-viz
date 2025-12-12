import react from "react";

const ZoomableCard = ({ title, value, unit, description }) => {
return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-300 dark:bg-gray-800">
        <div className="text-center">
            <h2 className="text-6xl font-bold text-gray-800 dark:text-white mb-12">{title}</h2>
            <div className="text-gray-900 dark:text-white font-bold text-8xl">
                {typeof value === 'number' ? value.toFixed(2) : value} {unit && <span className="text-5xl font-medium text-gray-400 ml-2">{unit}</span>}
            </div>
        </div>
    </div>
);
};

export default ZoomableCard;
