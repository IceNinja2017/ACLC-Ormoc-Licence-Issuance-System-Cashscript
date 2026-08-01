export default function BusinessForm({
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
                Business Name
                <input
                    name="businessName"
                    value={details.businessName || ""}
                    onChange={update}
                />
            </label>

            <label>
                Business Type
                <input
                    name="businessType"
                    value={details.businessType || ""}
                    onChange={update}
                />
            </label>

            <label>
                TIN
                <input
                    name="tin"
                    value={details.tin || ""}
                    onChange={update}
                />
            </label>
        </>
    );
}