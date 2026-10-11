// Breaks: no-string-classname.grit (string literal, expression string, template literal)
const size = "lg";

export const Title = () => <h1 className="title">Hello</h1>;
export const Subtitle = () => <h2 className={"subtitle"}>Hello</h2>;
export const Sized = () => <p className={`text-${size}`}>Hello</p>;
