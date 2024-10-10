type DateTextProps = {
	date: Date;
	prefix?: string;
};

export default function DateText({ date, prefix }: DateTextProps) {
	return (
		<p>
			{prefix}
			{date.toLocaleDateString()}
			{' - '}
			{date.toLocaleTimeString()}
		</p>
	);
}
