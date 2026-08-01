export default function PRCForm({
    details,
    setDetails,
}) {

    function update(e){
        setDetails({
            ...details,
            [e.target.name]: e.target.value
        });
    }

    return (
        <>
            <label>
                Profession
                <input
                    name="profession"
                    value={details.profession || ""}
                    onChange={update}
                />
            </label>

            <label>
                PRC Number
                <input
                    name="prcNumber"
                    value={details.prcNumber || ""}
                    onChange={update}
                />
            </label>

            <label>
                Board Exam Year
                <input
                    name="boardExamYear"
                    value={details.boardExamYear || ""}
                    onChange={update}
                />
            </label>
        </>
    );
}